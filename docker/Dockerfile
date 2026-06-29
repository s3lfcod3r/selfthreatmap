FROM python:3.12-alpine

# UTF-8 erzwingen — Emoji-Logs duerfen Request-Handler nie crashen
ENV PYTHONUTF8=1 PYTHONIOENCODING=utf-8

LABEL org.opencontainers.image.title="CrowdSec Threat Map"
LABEL org.opencontainers.image.description="Echtzeit-Angriffskarte fuer CrowdSec"
LABEL org.opencontainers.image.source="https://github.com/s3lfcod3r/selfthreatmap"
LABEL org.opencontainers.image.licenses="GPL-3.0-or-later"
LABEL org.opencontainers.image.authors="s3lfcod3r"
LABEL org.opencontainers.image.version="2.9.0"

# nginx (inkl. auth_request-Modul) fuer Dashboard + docker-cli fuer Unban
RUN apk add --no-cache nginx docker-cli curl

# App-Verzeichnisse
RUN mkdir -p /app /config /crowdsec/data /crowdsec/postoverflows /var/www/html /run/nginx

# Exporter + Auth-Modul + Auth-Seiten (Setup/Login/Einstellungen)
COPY crowdsec_exporter.py /app/crowdsec_exporter.py
COPY auth.py /app/auth.py
COPY login.html /app/login.html
COPY setup.html /app/setup.html
COPY settings.html /app/settings.html

# Dashboard
COPY index.html /var/www/html/index.html
COPY assets /var/www/html/assets

# nginx-Konfiguration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Port 8080 = Dashboard (nginx)
# Port 9456 = Exporter-API (Python) — nur intern, nginx proxied
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -sf http://localhost:9456/metrics > /dev/null || exit 1

ENTRYPOINT ["/entrypoint.sh"]
