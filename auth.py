#!/usr/bin/env python3
# ============================================================
# SelfThreatMap — Auth-Modul (Setup-Assistent, Login, 2FA/TOTP)
# Nur Python3-stdlib, keine externen Pakete.
#
#   • Erststart:  kein Konto -> Setup-Assistent im Browser
#   • Passwort:   PBKDF2-HMAC-SHA256 (200k Iterationen, Salt)
#   • 2FA:        optional, TOTP nach RFC 6238 (SHA1, 6 Stellen, 30s)
#   • Session:    HMAC-SHA256-signiertes Cookie (HttpOnly/SameSite)
#   • Persistenz: /config/auth.json (Volume) — überlebt Updates
#
# Alle Geheimnis-Vergleiche laufen zeitkonstant (hmac.compare_digest).
# ============================================================

import os
import hmac
import json
import time
import base64
import hashlib
import secrets
import struct
import threading
import logging

_log = logging.getLogger("selfthreatmap.auth")

# ── Konfiguration ───────────────────────────────────────────
AUTH_ENABLED = os.environ.get("AUTH_ENABLED", "true").strip().lower() == "true"
CONFIG_DIR = os.environ.get("CONFIG_DIR", "/config").strip() or "/config"
CRED_FILE = os.path.join(CONFIG_DIR, "auth.json")
SESSION_TTL = int(os.environ.get("SESSION_TTL", "86400"))          # 24h
SESSION_COOKIE = "stm_session"

# Optionaler Override des Session-Schlüssels (sonst in auth.json gespeichert)
_ENV_SESSION_SECRET = os.environ.get("SESSION_SECRET", "").strip()

# PBKDF2-Parameter
_PBKDF2_ITER = 200_000
_PBKDF2_ALGO = "sha256"

# Login-Brute-Force-Schutz
_MAX_FAILS = int(os.environ.get("LOGIN_MAX_FAILS", "5"))
_LOCKOUT_SECONDS = int(os.environ.get("LOGIN_LOCKOUT_SECONDS", "900"))  # 15 min

_store_lock = threading.RLock()
_login_state = {}            # ip -> {"fails": int, "until": float}
_login_lock = threading.Lock()


# ── Passwort-Hashing ────────────────────────────────────────
def hash_password(password):
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac(_PBKDF2_ALGO, password.encode("utf-8"), salt, _PBKDF2_ITER)
    return f"pbkdf2_{_PBKDF2_ALGO}${_PBKDF2_ITER}${salt.hex()}${dk.hex()}"


def verify_password(password, stored):
    try:
        algo, iter_s, salt_hex, hash_hex = stored.split("$")
        dk = hashlib.pbkdf2_hmac(algo.replace("pbkdf2_", ""), password.encode("utf-8"),
                                 bytes.fromhex(salt_hex), int(iter_s))
        return hmac.compare_digest(dk, bytes.fromhex(hash_hex))
    except Exception as exc:
        _log.debug("verify_password: ungültiges Hash-Format/Fehler: %s", exc)
        return False


# ── TOTP (RFC 6238) ─────────────────────────────────────────
def generate_totp_secret():
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def totp_at(secret_b32, when=None, step=30, digits=6):
    pad = "=" * (-len(secret_b32) % 8)
    key = base64.b32decode(secret_b32.upper() + pad, casefold=True)
    counter = int((when if when is not None else time.time()) // step)
    h = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
    offset = h[-1] & 0x0F
    code = (struct.unpack(">I", h[offset:offset + 4])[0] & 0x7FFFFFFF) % (10 ** digits)
    return str(code).zfill(digits)


def totp_verify(secret_b32, code, window=1):
    if not secret_b32 or not code:
        return False
    code = str(code).strip().replace(" ", "")
    if not code.isdigit():
        return False
    now = time.time()
    for drift in range(-window, window + 1):
        if hmac.compare_digest(totp_at(secret_b32, now + drift * 30), code):
            return True
    return False


def otpauth_url(secret_b32, account, issuer="SelfThreatMap"):
    from urllib.parse import quote
    label = quote(f"{issuer}:{account}")
    return (f"otpauth://totp/{label}?secret={secret_b32}"
            f"&issuer={quote(issuer)}&algorithm=SHA1&digits=6&period=30")


# ── Persistenter Store (/config/auth.json) ──────────────────
def _load():
    try:
        with open(CRED_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        # Legitim: noch kein Konto angelegt -> leerer Store.
        return {}
    except Exception as exc:
        # Korrupte/nicht lesbare Datei NIEMALS still als {} behandeln —
        # sonst "verschwindet" das Konto und der Setup-Assistent taucht neu auf.
        # Kaputte Datei sichern, bevor irgendetwas sie überschreibt.
        backup = CRED_FILE + ".corrupt"
        try:
            os.replace(CRED_FILE, backup)
            _log.error(
                "auth.json unlesbar/korrupt (%s) — Datei nach %s gesichert. "
                "Konto muss ggf. manuell wiederhergestellt werden.",
                exc, backup,
            )
        except Exception as move_exc:
            _log.error(
                "auth.json unlesbar/korrupt (%s) UND Sicherung nach %s fehlgeschlagen (%s).",
                exc, backup, move_exc,
            )
        return {}


def _save(store):
    os.makedirs(CONFIG_DIR, exist_ok=True)
    tmp = CRED_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(store, f, indent=2)
        # Daten physisch auf Platte zwingen, bevor atomar ersetzt wird —
        # verhindert leere/halbe auth.json nach Stromausfall/Crash.
        f.flush()
        os.fsync(f.fileno())
    try:
        os.chmod(tmp, 0o600)
    except Exception as exc:
        _log.warning("chmod 0600 auf %s fehlgeschlagen: %s", tmp, exc)
    os.replace(tmp, CRED_FILE)
    # Verzeichnis-Eintrag ebenfalls syncen (Linux) — sonst kann der Rename
    # bei Crash verloren gehen. Auf Plattformen ohne Verzeichnis-fsync ignorieren.
    try:
        dir_fd = os.open(CONFIG_DIR, os.O_RDONLY)
        try:
            os.fsync(dir_fd)
        finally:
            os.close(dir_fd)
    except (OSError, AttributeError) as exc:
        _log.debug("Verzeichnis-fsync auf %s nicht möglich: %s", CONFIG_DIR, exc)


class _Abort(Exception):
    """Signalisiert _update, dass NICHT gespeichert werden soll (Validierung fehlgeschlagen)."""

    def __init__(self, result):
        super().__init__()
        self.result = result


def _update(fn):
    """Atomar unter _store_lock: _load() -> fn(store) -> _save(store).

    fn ändert store in-place und liefert den durchgereichten Rückgabewert.
    Wirft fn ein _Abort, wird NICHT gespeichert und _Abort.result zurückgegeben —
    so bleibt bei fehlgeschlagener Validierung nichts halb geschrieben.
    Verhindert Load-Modify-Save-Races zwischen change_password/enable_totp/
    disable_totp, sodass kein sichtbarer Zwischenzustand entsteht.
    """
    with _store_lock:
        store = _load()
        try:
            result = fn(store)
        except _Abort as abort:
            return abort.result
        _save(store)
        return result


def is_setup_done():
    s = _load()
    return bool(s.get("username") and s.get("password_hash"))


def get_username():
    return _load().get("username", "")


def totp_enabled():
    s = _load()
    return bool(s.get("totp_enabled") and s.get("totp_secret"))


def _ensure_session_secret(store):
    """Stellt sicher, dass ein Session-Schlüssel existiert (in-place)."""
    if _ENV_SESSION_SECRET:
        return _ENV_SESSION_SECRET
    if not store.get("session_secret"):
        store["session_secret"] = secrets.token_hex(32)
    return store["session_secret"]


def session_key():
    """Aktueller Session-Signierschlüssel als Bytes."""
    if _ENV_SESSION_SECRET:
        return _ENV_SESSION_SECRET.encode("utf-8")
    s = _load()
    key = s.get("session_secret")
    if not key:
        # Noch kein Konto/Schlüssel -> ephemerer Zufallswert (keine Sessions möglich)
        return b"__no_session_secret_configured__"
    return key.encode("utf-8")


# ── Konto-Verwaltung ────────────────────────────────────────
USERNAME_MAXLEN = 32
PASSWORD_MINLEN = 8


def validate_username(name):
    name = (name or "").strip()
    if not (1 <= len(name) <= USERNAME_MAXLEN):
        return None
    if not all(c.isalnum() or c in "._-" for c in name):
        return None
    return name


def create_account(username, password):
    """Legt das erste Konto an. Gibt (ok, code) zurück — code = i18n-Schlüssel."""
    with _store_lock:
        if is_setup_done():
            return False, "account_exists"
        uname = validate_username(username)
        if not uname:
            return False, "username_invalid"
        if len(password or "") < PASSWORD_MINLEN:
            return False, "password_short"
        store = {
            "version": 1,
            "username": uname,
            "password_hash": hash_password(password),
            "totp_secret": None,
            "totp_enabled": False,
        }
        _ensure_session_secret(store)
        _save(store)
        return True, "ok"


def verify_login(username, password, code):
    """Login-Prüfung: Benutzer + Passwort (+ 2FA falls aktiviert)."""
    store = _load()
    if not store.get("password_hash"):
        return False
    user_ok = hmac.compare_digest(username or "", store.get("username", ""))
    pass_ok = verify_password(password or "", store.get("password_hash", ""))
    if store.get("totp_enabled") and store.get("totp_secret"):
        totp_ok = totp_verify(store["totp_secret"], code or "")
    else:
        totp_ok = True
    return user_ok and pass_ok and totp_ok


def change_password(current, new):
    def _fn(store):
        if not verify_password(current or "", store.get("password_hash", "")):
            raise _Abort((False, "current_wrong"))
        if len(new or "") < PASSWORD_MINLEN:
            raise _Abort((False, "password_short"))
        store["password_hash"] = hash_password(new)
        return True, "ok"

    return _update(_fn)


def enable_totp(secret, code):
    """Aktiviert 2FA, wenn der eingegebene Code zum (pending) Secret passt."""
    def _fn(store):
        if not totp_verify(secret, code or ""):
            raise _Abort((False, "totp_mismatch"))
        store["totp_secret"] = secret
        store["totp_enabled"] = True
        return True, "ok"

    return _update(_fn)


def disable_totp(password):
    def _fn(store):
        if not verify_password(password or "", store.get("password_hash", "")):
            raise _Abort((False, "password_wrong"))
        store["totp_secret"] = None
        store["totp_enabled"] = False
        return True, "ok"

    return _update(_fn)


# ── Session-Cookies (signiert) ──────────────────────────────
def _b64u(raw):
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64u_dec(s):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def make_session(username):
    key = session_key()
    payload = {"u": username, "exp": int(time.time()) + SESSION_TTL}
    body = _b64u(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    sig = _b64u(hmac.new(key, body.encode("ascii"), hashlib.sha256).digest())
    return f"{body}.{sig}"


def verify_session(token):
    try:
        key = session_key()
        body, sig = token.split(".", 1)
        expected = _b64u(hmac.new(key, body.encode("ascii"), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(_b64u_dec(body))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload.get("u")
    except Exception as exc:
        _log.debug("verify_session: ungültiges/kaputtes Token: %s", exc)
        return None


def parse_cookies(cookie_header):
    out = {}
    if not cookie_header:
        return out
    for part in cookie_header.split(";"):
        if "=" in part:
            k, v = part.split("=", 1)
            out[k.strip()] = v.strip()
    return out


# ── Login-Rate-Limit / Lockout ──────────────────────────────
def login_allowed(ip):
    with _login_lock:
        st = _login_state.get(ip)
        return not (st and st.get("until", 0) > time.time())


def login_retry_after(ip):
    with _login_lock:
        st = _login_state.get(ip)
        if st and st.get("until", 0) > time.time():
            return int(st["until"] - time.time())
        return 0


def record_login_failure(ip):
    with _login_lock:
        st = _login_state.setdefault(ip, {"fails": 0, "until": 0})
        st["fails"] += 1
        if st["fails"] >= _MAX_FAILS:
            st["until"] = time.time() + _LOCKOUT_SECONDS
            st["fails"] = 0


def record_login_success(ip):
    with _login_lock:
        _login_state.pop(ip, None)
