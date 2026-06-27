<div align="center">

# 🛡️ SelfThreatMap

**Live attack map straight from your local CrowdSec database**
**Live-Angriffskarte direkt aus deiner lokalen CrowdSec-Datenbank**

[![Version](https://img.shields.io/badge/version-v2.0.0-33a78c?style=flat-square)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-GPL--3.0-3fb950?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Docker%20%7C%20Unraid-1db8d4?style=flat-square)](#-installation)
[![Python](https://img.shields.io/badge/python-3.12-9dbdd0?style=flat-square&logo=python&logoColor=white)](crowdsec_exporter.py)
[![Docker](https://img.shields.io/badge/ghcr.io-s3lfcod3r%2Fselfthreatmap-00e5c8?style=flat-square&logo=docker&logoColor=white)](https://github.com/s3lfcod3r/selfthreatmap/pkgs/container/selfthreatmap)

*Part of the **Self** suite of self-hosted tools · Teil der **Self**-Suite*

![SelfThreatMap](preview.png)

</div>

---

🇬🇧 **English** · [🇩🇪 Deutsch unten](#-deutsch)

## ✨ Features

- 🌍 **Interactive world map** with animated attack paths (D3.js) — all attack points visible on load
- 🚀 **30+ flight-path styles** — rocket (default), comet, laser, particle stream, arcs, impact rings & more, switchable in settings
- 🎯 **Auto-fit zoom** + city names when zoomed in
- 🔍 **Real-time search** by IP, country, city, scenario, ASN
- 🚫 **Ban status & one-click IP unban** straight from the dashboard
- 📊 **Sparkline**, Top-10, live feed with pagination & **CSV export**
- 🛡️ **Dynamic IP whitelist** — auto-whitelists your own changing IP every 15 min (no self-ban)
- 🌐 **Bilingual UI** (`LANGUAGE=de` / `en`) · 📱 fully responsive
- 🎨 **Self design** — dark Teal/Cyan theme from the shared Self brand kit

## 🚀 Installation

### Unraid (Community Apps)

Unraid → **Apps** → search `selfthreatmap` → install → fill in `SERVER_LAT` / `SERVER_LON` and the CrowdSec data path → **Apply**. Dashboard: `http://YOUR-UNRAID-IP:8080`.

### Docker

```bash
docker run -d \
  --name selfthreatmap \
  --restart unless-stopped \
  -p 8080:8080 \
  -v /path/to/crowdsec/data:/crowdsec/data:ro \
  -v /path/to/crowdsec/postoverflows:/crowdsec/postoverflows \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  --group-add 999 \
  -e SERVER_LAT=52.5200 \
  -e SERVER_LON=13.4050 \
  -e SERVER_NAME=Berlin \
  -e LANGUAGE=en \
  ghcr.io/s3lfcod3r/selfthreatmap:latest
```

Compose file: [`docker/docker-compose.yml`](docker/docker-compose.yml).

## 🚀 Flight-path styles

The signature feature: how each attack travels from its origin to your server. Pick from **30+ animated styles** under **Settings → Flight-path style** (default: **Rocket**). Implemented in [`assets/js/rocket-styles.js`](assets/js/rocket-styles.js) — easy to extend.

| Group | Styles |
|-------|--------|
| Rockets | Rocket · Twin rocket · Arrow · Data packet |
| Comets & trails | Comet · Comet + sparks · Meteor · Fading trail · Gradient trail · Mist trail · Spark trail |
| Beams & lasers | Laser pulse · Constant beam · Neon tube · Lightning · Plasma orb |
| Particles & dots | Particle stream · Tracer · Bead chain · Fireflies · Inward pull · Echo ghosts · Double helix |
| Lines & special | Clean arc · Twin line · Morse dash · Sine wave · Pulse ring · Impact ring · Hologram |
| Classic (legacy) | Classic · Console (dashed arcs) · Minimal |

## ⚙️ Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_LAT` / `SERVER_LON` | `0.0` | ⚠️ Your server coordinates (the map's home point) |
| `SERVER_NAME` | `MeinServer` | Display name of the home marker |
| `LANGUAGE` | `de` | UI language: `de` or `en` |
| `CROWDSEC_CONTAINER` | `crowdsec` | Name of the CrowdSec Docker container |
| `CROWDSEC_DB_PATH` | `/crowdsec/data/crowdsec.db` | Path to the CrowdSec SQLite DB |
| `CROWDSEC_MMDB_PATH` | `/crowdsec/data/GeoLite2-City.mmdb` | GeoIP database (for city names) |
| `WHITELIST_ENABLED` | `true` | Dynamic self-IP whitelist |
| `WHITELIST_INTERVAL` | `900` | Whitelist check interval (seconds) |
| `UNBAN_API_TOKEN` | *(empty)* | **Recommended** — protects the `/unban` endpoint |
| `CACHE_TTL` / `DAYS_BACK` | `60` / `365` | Metric cache & history window |

## 🔒 Security

The dashboard can lift CrowdSec bans via the Docker socket — treat port **8080 like an admin UI**: don't expose it to the internet, keep it on LAN/VPN, and set a random `UNBAN_API_TOKEN` (`openssl rand -hex 32`).

---

## 🇩🇪 Deutsch

**SelfThreatMap** zeigt Angriffe aus deiner lokalen **CrowdSec**-Datenbank live auf einer Weltkarte — beim Aufruf sind alle Angriffspunkte sichtbar, beim Reinzoomen erscheinen Stadtnamen.

### ✨ Funktionen

- 🌍 **Interaktive Weltkarte** mit animierten Angriffsbahnen (D3.js)
- 🚀 **Über 30 Bahn-Stile** — Rakete (Standard), Komet, Laser, Partikel-Strom, Bögen, Einschlag-Ringe u. v. m., umschaltbar in den Einstellungen
- 🎯 **Auto-Fit-Zoom** + Stadtnamen beim Reinzoomen
- 🔍 **Echtzeit-Suche** nach IP, Land, Stadt, Szenario, ASN
- 🚫 **Ban-Status & IP-Unban** direkt aus dem Dashboard
- 📊 **Sparkline**, Top-10, Live-Feed mit Pagination & **CSV-Export**
- 🛡️ **Dynamische IP-Whitelist** — eigene wechselnde IP automatisch alle 15 Min whitelisten (kein Selbst-Ban)
- 🌐 **Zweisprachig** (`LANGUAGE=de` / `en`) · 📱 voll responsive
- 🎨 **Self-Design** — dunkles Teal/Cyan-Theme aus dem gemeinsamen Self-Brand-Kit

### 🚀 Installation (Unraid)

Unraid → **Apps** → `selfthreatmap` suchen → installieren → `SERVER_LAT` / `SERVER_LON` und den CrowdSec-Datenpfad eintragen → **Anwenden**. Dashboard: `http://DEINE-UNRAID-IP:8080`.

Koordinaten: Rechtsklick auf [Google Maps](https://maps.google.com) → „Was ist hier?". CrowdSec-Pfad: `docker inspect crowdsec | grep -A5 "Mounts"`.

### 🚀 Bahn-Stile

Das Herzstück: wie jeder Angriff von der Quelle zu deinem Server fliegt. **Über 30 animierte Stile** unter **Einstellungen → Bahn-Stil** (Standard: **Rakete**). Code: [`assets/js/rocket-styles.js`](assets/js/rocket-styles.js) — leicht erweiterbar.

### 🔒 Sicherheit

Das Dashboard kann über den Docker-Socket CrowdSec-Bans aufheben — behandle Port **8080 wie eine Admin-Oberfläche**: nicht ins Internet forwarden, nur im LAN/VPN nutzen und ein zufälliges `UNBAN_API_TOKEN` setzen (`openssl rand -hex 32`).

### 🗺️ GeoIP / Stadtnamen

Ohne GeoIP-Datenbank werden nur Länderpunkte angezeigt. [MaxMind GeoLite2-City](https://www.maxmind.com/en/geolite2/signup) kostenlos laden, `GeoLite2-City.mmdb` in den CrowdSec-Datenordner legen, Container neu starten.

---

## 🔗 Links

- [CrowdSec Docs](https://docs.crowdsec.net) · [CrowdSec Docker Hub](https://hub.docker.com/r/crowdsecurity/crowdsec)
- [MaxMind GeoLite2](https://www.maxmind.com/en/geolite2/signup)
- Changelog → [CHANGELOG.md](CHANGELOG.md)

## 📄 License

**GNU GPL-3.0** — see [LICENSE](LICENSE). Free to use, modify and share; forks must stay GPL-3.0 and open-source.

> *SelfThreatMap — part of the Self suite by [s3lfcod3r](https://github.com/s3lfcod3r). Built on the original CrowdSec Threat Map.*
