#!/bin/sh
set -e

# ============================================================
# CrowdSec Threat Map — Container Entrypoint v2.8.0
# ============================================================

log() { echo "[$(date '+%F %T')] $*"; }

log "🛡️  CrowdSec Threat Map startet..."
log "   Version: v2.8.0"

# ── Pflichtprüfungen ──
if [ -z "$SERVER_LAT" ] || [ "$SERVER_LAT" = "0.0" ]; then
    log "⚠️  SERVER_LAT nicht gesetzt! Bitte in docker-compose.yml eintragen."
fi
if [ -z "$SERVER_LON" ] || [ "$SERVER_LON" = "0.0" ]; then
    log "⚠️  SERVER_LON nicht gesetzt! Bitte in docker-compose.yml eintragen."
fi

# ── DB-Pfad prüfen ──
DB_FILE="${CROWDSEC_DB_PATH:-/crowdsec/data/crowdsec.db}"
if [ ! -f "$DB_FILE" ]; then
    log "❌ CrowdSec-Datenbank nicht gefunden: $DB_FILE"
    log "   Bitte volumes in docker-compose.yml prüfen!"
    log "   Erwartet: /crowdsec/data/crowdsec.db"
    exit 1
fi
log "✅ Datenbank gefunden: $DB_FILE"

# ── GeoLite2 prüfen ──
MMDB_FILE="${CROWDSEC_MMDB_PATH:-/crowdsec/data/GeoLite2-City.mmdb}"
if [ -f "$MMDB_FILE" ]; then
    log "✅ GeoLite2 gefunden: $MMDB_FILE (Stadtanzeige aktiv)"
else
    log "ℹ️  GeoLite2 nicht gefunden — Stadtanzeige deaktiviert"
fi

# ── Whitelist-Info ──
WL_ENABLED="${WHITELIST_ENABLED:-true}"
if [ "$WL_ENABLED" = "true" ]; then
    log "🛡️  Dynamische Whitelist: AKTIV (Interval: ${WHITELIST_INTERVAL:-900}s)"
else
    log "ℹ️  Dynamische Whitelist: deaktiviert"
fi

# ── Umgebungsvariablen exportieren (werden vom Exporter gelesen) ──
export CROWDSEC_DB_PATH="${CROWDSEC_DB_PATH:-/crowdsec/data/crowdsec.db}"
export CROWDSEC_MMDB_PATH="${CROWDSEC_MMDB_PATH:-/crowdsec/data/GeoLite2-City.mmdb}"
export SERVER_LAT="${SERVER_LAT:-0.0}"
export SERVER_LON="${SERVER_LON:-0.0}"
export SERVER_NAME="${SERVER_NAME:-MeinServer}"
export CROWDSEC_CONTAINER_NAME="${CROWDSEC_CONTAINER:-crowdsec}"
export CACHE_TTL="${CACHE_TTL:-60}"
export DAYS_BACK="${DAYS_BACK:-365}"
export WHITELIST_ENABLED="${WHITELIST_ENABLED:-true}"
export WHITELIST_FILE="${WHITELIST_FILE:-/crowdsec/postoverflows/s01-whitelist/my-whitelist.yaml}"
export WHITELIST_INTERVAL="${WHITELIST_INTERVAL:-900}"
export CROWDSEC_RESTART_WAIT="${CROWDSEC_RESTART_WAIT:-15}"
export CROWDSEC_RESTART_COOLDOWN="${CROWDSEC_RESTART_COOLDOWN:-300}"

# ── Login + 2FA (Auth) ──
export AUTH_ENABLED="${AUTH_ENABLED:-true}"
export ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
export ADMIN_PASSWORD_HASH="${ADMIN_PASSWORD_HASH:-}"
export TOTP_SECRET="${TOTP_SECRET:-}"
export SESSION_SECRET="${SESSION_SECRET:-}"
export SESSION_TTL="${SESSION_TTL:-86400}"
export COOKIE_SECURE="${COOKIE_SECURE:-false}"
export LOGIN_MAX_FAILS="${LOGIN_MAX_FAILS:-5}"
export LOGIN_LOCKOUT_SECONDS="${LOGIN_LOCKOUT_SECONDS:-900}"
# Exporter bindet nur lokal; nginx proxied nach aussen
export LISTEN_HOST="${LISTEN_HOST:-127.0.0.1}"

export LANGUAGE="${LANGUAGE:-de}"

# ── SERVER_NAME absichern (wird per sed in index.html injiziert) ──
# Nur unkritische Zeichen erlauben, sonst koennte ein Wert wie ';alert(1)//
# in den JS-Code der Seite gelangen.
SAFE_SERVER_NAME=$(printf '%s' "$SERVER_NAME" | tr -cd 'A-Za-z0-9 ._-' | cut -c1-40)
if [ "$SAFE_SERVER_NAME" != "$SERVER_NAME" ]; then
    log "⚠️  SERVER_NAME bereinigt: '${SERVER_NAME}' → '${SAFE_SERVER_NAME}'"
fi
SERVER_NAME="$SAFE_SERVER_NAME"
export SERVER_NAME

# ── index.html mit korrekter Exporter-URL patchen ──
log "🔧 Dashboard konfigurieren..."

# Relative URL /metrics — nginx proxied intern zu Port 9456
METRICS_URL="${EXPORTER_URL:-/metrics}"

sed -i "s|http://EURE-UNRAID-IP:9456/metrics|${METRICS_URL}|g" \
    /var/www/html/index.html 2>/dev/null || true
sed -i "s|let SERVER_LAT   = [^;]*;|let SERVER_LAT   = ${SERVER_LAT};|g" \
    /var/www/html/index.html 2>/dev/null || true
sed -i "s|let SERVER_LON   = [^;]*;|let SERVER_LON   = ${SERVER_LON};|g" \
    /var/www/html/index.html 2>/dev/null || true
sed -i "s|let SERVER_NAME_MAP = '[^']*';|let SERVER_NAME_MAP = '${SERVER_NAME}';|g" \
    /var/www/html/index.html 2>/dev/null || true
log "📍 Server-Position: ${SERVER_LAT}, ${SERVER_LON} (${SERVER_NAME})"
if awk -v lat="$SERVER_LAT" 'BEGIN{exit !(lat+0<-90 || lat+0>90)}' 2>/dev/null; then
    log "⚠️  SERVER_LAT=${SERVER_LAT} ungültig (±90) — oft sind Breiten- und Längengrad vertauscht!"
fi
if awk -v lon="$SERVER_LON" 'BEGIN{exit !(lon+0<-180 || lon+0>180)}' 2>/dev/null; then
    log "⚠️  SERVER_LON=${SERVER_LON} ungültig (±180)!"
fi

# Sprache setzen (de oder en)
LANG_VAL="${LANGUAGE:-de}"
if [ "$LANG_VAL" != "de" ] && [ "$LANG_VAL" != "en" ]; then
    log "⚠️  LANGUAGE='${LANG_VAL}' unbekannt — Fallback auf 'de'"
    LANG_VAL="de"
fi
sed -i "s|'LANGUAGE_PLACEHOLDER'|'${LANG_VAL}'|g" \
    /var/www/html/index.html 2>/dev/null || true
log "🌐 Sprache: ${LANG_VAL}"

log "✅ Dashboard konfiguriert (Exporter-URL: ${METRICS_URL})"

# ── Nginx starten ──
log "🌐 Nginx starten (Dashboard auf Port 8080)..."
nginx -g "daemon off;" &
NGINX_PID=$!

# ── Exporter starten ──
log "📡 Exporter starten (API auf Port 9456)..."
python3 /app/crowdsec_exporter.py &
EXPORTER_PID=$!

log "✅ Alles läuft!"
log "   Dashboard: http://<EURE-IP>:8080  (Login erforderlich)"
if [ "${AUTH_ENABLED:-true}" = "true" ]; then
    log "   🔐 Login + 2FA aktiv — Zugangsdaten ggf. im Exporter-Log oben"
else
    log "   ⚠️  AUTH_ENABLED=false — Dashboard ist OHNE Login erreichbar!"
fi

# ── Warten und bei Absturz neu starten ──
while true; do
    if ! kill -0 $EXPORTER_PID 2>/dev/null; then
        log "⚠️  Exporter abgestürzt — Neustart..."
        python3 /app/crowdsec_exporter.py &
        EXPORTER_PID=$!
    fi
    if ! kill -0 $NGINX_PID 2>/dev/null; then
        log "⚠️  Nginx abgestürzt — Neustart..."
        nginx -g "daemon off;" &
        NGINX_PID=$!
    fi
    sleep 10
done
