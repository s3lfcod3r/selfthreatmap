#!/usr/bin/env python3
# ============================================================
# SelfThreatMap — Auth-Modul (Login + 2FA / TOTP)
# Nur Python3-stdlib, keine externen Pakete.
#
#   • Passwort-Hashing:  PBKDF2-HMAC-SHA256 (200k Iterationen, Salt)
#   • 2FA:               TOTP nach RFC 6238 (SHA1, 6 Stellen, 30s)
#   • Session:           HMAC-SHA256-signiertes Cookie (HttpOnly/SameSite)
#   • Brute-Force:       In-Memory Lockout pro IP
#
# Alle Vergleiche laufen zeitkonstant (hmac.compare_digest).
# ============================================================

import os
import hmac
import time
import json
import base64
import hashlib
import secrets
import struct
import threading

# ── Konfiguration aus Umgebungsvariablen ────────────────────
AUTH_ENABLED = os.environ.get("AUTH_ENABLED", "true").strip().lower() == "true"
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin").strip() or "admin"
SESSION_TTL = int(os.environ.get("SESSION_TTL", "86400"))          # 24h
SESSION_COOKIE = "stm_session"

# PBKDF2-Parameter
_PBKDF2_ITER = 200_000
_PBKDF2_ALGO = "sha256"

# Login-Brute-Force-Schutz
_MAX_FAILS = int(os.environ.get("LOGIN_MAX_FAILS", "5"))
_LOCKOUT_SECONDS = int(os.environ.get("LOGIN_LOCKOUT_SECONDS", "900"))  # 15 min

# Hinweise, die der Hauptprozess beim Start ausgeben soll
STARTUP_NOTICES = []

_login_state = {}            # ip -> {"fails": int, "until": float}
_login_lock = threading.Lock()


# ── Passwort-Hashing ────────────────────────────────────────
def hash_password(password):
    """Erzeugt 'pbkdf2_sha256$iter$salt_hex$hash_hex'."""
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac(_PBKDF2_ALGO, password.encode("utf-8"), salt, _PBKDF2_ITER)
    return f"pbkdf2_{_PBKDF2_ALGO}${_PBKDF2_ITER}${salt.hex()}${dk.hex()}"


def verify_password(password, stored):
    """Prueft Passwort gegen gespeicherten Hash — zeitkonstant."""
    try:
        algo, iter_s, salt_hex, hash_hex = stored.split("$")
        iterations = int(iter_s)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(hash_hex)
        dk = hashlib.pbkdf2_hmac(algo.replace("pbkdf2_", ""), password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(dk, expected)
    except Exception:
        return False


# ── TOTP (RFC 6238) ─────────────────────────────────────────
def generate_totp_secret():
    """Zufaelliges Base32-Secret (160 bit) ohne Padding."""
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def totp_at(secret_b32, when=None, step=30, digits=6):
    pad = "=" * (-len(secret_b32) % 8)
    key = base64.b32decode(secret_b32.upper() + pad, casefold=True)
    counter = int((when if when is not None else time.time()) // step)
    msg = struct.pack(">Q", counter)
    h = hmac.new(key, msg, hashlib.sha1).digest()
    offset = h[-1] & 0x0F
    code = (struct.unpack(">I", h[offset:offset + 4])[0] & 0x7FFFFFFF) % (10 ** digits)
    return str(code).zfill(digits)


def totp_verify(secret_b32, code, window=1):
    """Prueft TOTP-Code mit +/- window Zeitfenstern (Uhren-Toleranz)."""
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


# ── Session-Cookies (signiert) ──────────────────────────────
def _b64u(raw):
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64u_dec(s):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def make_session(username, secret_key):
    payload = {"u": username, "exp": int(time.time()) + SESSION_TTL}
    body = _b64u(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    sig = _b64u(hmac.new(secret_key, body.encode("ascii"), hashlib.sha256).digest())
    return f"{body}.{sig}"


def verify_session(token, secret_key):
    """Gibt Username zurueck wenn Signatur gueltig und nicht abgelaufen, sonst None."""
    try:
        body, sig = token.split(".", 1)
        expected = _b64u(hmac.new(secret_key, body.encode("ascii"), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(_b64u_dec(body))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload.get("u")
    except Exception:
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
        if not st:
            return True
        if st.get("until", 0) > time.time():
            return False
        return True


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


# ── Effektive Anmeldedaten (beim Import einmalig bestimmt) ───
def _resolve_credentials():
    pw_hash = os.environ.get("ADMIN_PASSWORD_HASH", "").strip()
    pw_plain = os.environ.get("ADMIN_PASSWORD", "").strip()
    if pw_hash:
        resolved_hash = pw_hash
    elif pw_plain:
        resolved_hash = hash_password(pw_plain)
    else:
        # Kein Passwort gesetzt -> sicheres Zufallspasswort generieren und anzeigen
        gen = secrets.token_urlsafe(12)
        resolved_hash = hash_password(gen)
        STARTUP_NOTICES.append(
            "Kein ADMIN_PASSWORD gesetzt — generiertes Passwort fuer Benutzer "
            f"'{ADMIN_USERNAME}': {gen}  (jetzt notieren und ADMIN_PASSWORD setzen!)")

    secret = os.environ.get("TOTP_SECRET", "").strip()
    if not secret:
        secret = generate_totp_secret()
        STARTUP_NOTICES.append(
            "Kein TOTP_SECRET gesetzt — neues 2FA-Secret generiert. In Authenticator-App "
            "eintragen (Google Authenticator / SelfAuthenticator):")
        STARTUP_NOTICES.append(f"  TOTP_SECRET={secret}")
        STARTUP_NOTICES.append(f"  {otpauth_url(secret, ADMIN_USERNAME)}")
        STARTUP_NOTICES.append(
            "  Danach TOTP_SECRET als Umgebungsvariable setzen, damit es Neustarts ueberlebt.")

    session_key = os.environ.get("SESSION_SECRET", "").strip()
    if not session_key:
        session_key = secrets.token_hex(32)
        STARTUP_NOTICES.append(
            "Kein SESSION_SECRET gesetzt — temporaeres generiert (alle Logins gehen bei "
            "Neustart verloren). Fuer dauerhafte Sessions SESSION_SECRET setzen.")

    return resolved_hash, secret, session_key.encode("utf-8")


PASSWORD_HASH, TOTP_SECRET, SESSION_KEY = _resolve_credentials()


def check_credentials(username, password, totp_code):
    """Vollstaendige Anmeldepruefung: Benutzer + Passwort + 2FA."""
    user_ok = hmac.compare_digest(username or "", ADMIN_USERNAME)
    pass_ok = verify_password(password or "", PASSWORD_HASH)
    totp_ok = totp_verify(TOTP_SECRET, totp_code or "")
    # Alle Faktoren auswerten (kein Early-Return) — gegen User-Enumeration.
    return user_ok and pass_ok and totp_ok
