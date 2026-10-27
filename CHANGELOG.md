# 📰 Changelog

Newest version first. Full release notes (German) per version: [docs/CHANGELOG-DETAILS.md](docs/CHANGELOG-DETAILS.md).
Neueste Version zuerst. Ausführliche Release-Notes je Version: [docs/CHANGELOG-DETAILS.md](docs/CHANGELOG-DETAILS.md).

---

## 3.0.0 · October 2026
- 🇬🇧 **Live firewall drops removed** (`/drops` API, `DROPS_*` variables, drops folder in the Unraid template) — the code came from a third-party fork. SelfThreatMap now contains only own code; the license is consistently *all rights reserved* (old GPL notes removed from `index.html` and the Docker label).
- 🇩🇪 **Live-Firewall-Drops entfernt** (`/drops`-API, `DROPS_*`-Variablen, Drops-Verzeichnis in der Unraid-Vorlage) — der Code stammte aus einem fremden Fork. SelfThreatMap enthält jetzt nur eigenen Code; die Lizenz ist durchgehend *Alle Rechte vorbehalten* (alte GPL-Hinweise aus `index.html` und dem Docker-Label entfernt).

## 2.9.1 · October 2026
- 🇬🇧 **MMDB reader fixed** (pointer decoding), **IP cache**, city straight from CrowdSec coordinates, `/metrics` answers instantly and refreshes in the background. UI not tested in the browser.
- 🇩🇪 **MMDB-Leser korrigiert** (Pointer-Auflösung), **IP-Cache**, Stadt direkt aus den CrowdSec-Koordinaten, `/metrics` antwortet sofort und aktualisiert im Hintergrund. Oberfläche nicht im Browser getestet.

## 2.9.0 · June 2026 🔒
- 🇬🇧 **Setup wizard** in the browser instead of secrets in env vars, settings page with **optional 2FA via QR code**, account stored in the `/config` volume; login, setup and settings in **12 languages**.
- 🇩🇪 **Einrichtungs-Assistent** im Browser statt Geheimnissen in Umgebungsvariablen, Einstellungsseite mit **optionaler 2FA per QR-Code**, Konto im `/config`-Volume; Anmeldung, Einrichtung und Einstellungen in **12 Sprachen**.

## 2.8.0 · June 2026 🔒
- 🇬🇧 Security update: **login + 2FA** for the whole dashboard (nginx `auth_request`), brute-force lockout, **unban fails closed**, exporter bound to `127.0.0.1`, **XSS fixed**, CORS `*` removed, CSP and security headers.
- 🇩🇪 Sicherheitsupdate: **Login + 2FA** für das ganze Dashboard (nginx `auth_request`), Sperre gegen Durchprobieren, **Unban nur mit Sitzung**, Exporter nur auf `127.0.0.1`, **XSS behoben**, CORS `*` entfernt, CSP und Sicherheits-Header.

## 2.7.2 · June 2026
- 🇬🇧 Origin dots coloured by attack count (green → yellow → orange → red).
- 🇩🇪 Herkunftspunkte nach Angriffszahl gefärbt (grün → gelb → orange → rot).

## 2.7.1 · June 2026
- 🇬🇧 ORIGINS overlay without overlapping labels; city names from zoom 4×.
- 🇩🇪 HERKÜNFTE-Overlay ohne überlappende Beschriftungen; Stadtnamen ab Zoom 4×.

## 2.7.0 · June 2026
- 🇬🇧 New live **ORIGINS** map overlay; chosen profile is remembered after reload.
- 🇩🇪 Neues Live-Karten-Overlay **HERKÜNFTE**; gewähltes Profil bleibt nach dem Neuladen erhalten.

## 2.6.0 · June 2026
- 🇬🇧 **Attack-origin overview** (all countries + top cities) behind the "Countries" stat; top control row tidied up.
- 🇩🇪 **Herkünfte-Übersicht** (alle Länder + Top-Städte) hinter dem „LÄNDER“-Wert; obere Steuerzeile aufgeräumt.

## 2.5.1 · June 2026
- 🇬🇧 Fix: profile dropdown could not be opened (now self-initialising + lazy build).
- 🇩🇪 Fix: Profil-Auswahl ließ sich nicht öffnen (jetzt Selbst-Init + Nachbauen beim Klick).

## 2.5.0 · June 2026
- 🇬🇧 **54 profiles** (presets) in 7 groups; city names stay visible up to maximum zoom.
- 🇩🇪 **54 Profile** (Voreinstellungen) in 7 Gruppen; Stadtnamen bleiben bis zum Maximalzoom sichtbar.

## 2.4.1 · June 2026
- 🇬🇧 City-name zoom range up to 25×.
- 🇩🇪 Zoombereich für Stadtnamen bis 25×.

## 2.4.0 · June 2026
- 🇬🇧 **Works offline** — d3, topojson and world map bundled, no CDN; `/metrics` gzip-compressed; language switch on mobile; pinch zoom allowed.
- 🇩🇪 **Läuft offline** — d3, topojson und Weltkarte mitgeliefert, kein CDN; `/metrics` gzip-komprimiert; Sprachwahl am Handy; Pinch-Zoom erlaubt.

## 2.3.2 · June 2026
- 🇬🇧 Fix: language and theme dropdowns could not be opened.
- 🇩🇪 Fix: Sprach- und Theme-Auswahl ließen sich nicht öffnen.

## 2.3.1 · June 2026
- 🇬🇧 Real Self shield as logo and favicon; official Self avatar as container icon.
- 🇩🇪 Echtes Self-Schild als Logo und Favicon; offizieller Self-Avatar als Container-Icon.

## 2.3.0 · June 2026
- 🇬🇧 Optional **live firewall drops** API (`/drops`, off by default).
- 🇩🇪 Optionale **Live-Firewall-Drops**-API (`/drops`, standardmäßig aus).

## 2.2.0 · June 2026
- 🇬🇧 **12 European languages** with in-app flag dropdown.
- 🇩🇪 **12 europäische Sprachen** mit Flaggen-Auswahl in der App.

## 2.1.3 · June 2026
- 🇬🇧 Fix: style preview in settings froze on the first frame.
- 🇩🇪 Fix: Stil-Vorschau in den Einstellungen fror beim ersten Bild ein.

## 2.1.2 · June 2026
- 🇬🇧 Theme dropdown; configurable city-name zoom range.
- 🇩🇪 Theme-Aufklappmenü; Zoombereich für Stadtnamen einstellbar.

## 2.1.1 · June 2026
- 🇬🇧 Branding polish (app icon, Self wordmark colours); animated **live preview** of the flight-path style.
- 🇩🇪 Branding-Feinschliff (App-Icon, Self-Farben der Wortmarke); animierte **Live-Vorschau** des Bahn-Stils.

## 2.1.0 · June 2026
- 🇬🇧 Own logo, **10 colour themes**, **replay loop**.
- 🇩🇪 Eigenes Logo, **10 Farbthemen**, **Replay-Schleife**.

## 2.0.0 · June 2026
- 🇬🇧 **Rebrand to SelfThreatMap** (Self suite, GHCR image, Unraid template) and **30+ flight-path styles**; based on the CrowdSec Threat Map.
- 🇩🇪 **Rebrand zu SelfThreatMap** (Self-Suite, GHCR-Image, Unraid-Vorlage) und **über 30 Bahn-Stile**; basiert auf der CrowdSec Threat Map.

## 1.5.0 · May 2026
- 🇬🇧 **Console-style attack map**: replay with timeline (24H / 48H, 0.5× / 1× / 2×), rocket animation, colours by threat type.
- 🇩🇪 **Angriffskarte im Console-Stil**: Replay mit Zeitleiste (24H / 48H, 0,5× / 1× / 2×), Raketen-Animation, Farben nach Bedrohungsart.

## 1.4.3 · May 2026 🔒
- 🇬🇧 Security update: **IP validation** for unban and whitelist, optional `UNBAN_API_TOKEN`, no CORS on `/unban`, restart cooldown for CrowdSec.
- 🇩🇪 Sicherheitsupdate: **IP-Prüfung** für Unban und Whitelist, optionales `UNBAN_API_TOKEN`, kein CORS auf `/unban`, Neustart-Sperrzeit für CrowdSec.

## 1.4.1 · April 2026
- 🇬🇧 Line toggle, **dynamic IP whitelist** in the exporter (every 15 min), responsive controls.
- 🇩🇪 Linien-Schalter, **dynamische IP-Whitelist** im Exporter (alle 15 Min), mitwachsende Bedienelemente.

## 1.4.0 · April 2026
- 🇬🇧 **Unban reworked** (decision + alert), ban status in the feed, city labels and centred country names on the map.
- 🇩🇪 **Unban überarbeitet** (Decision + Alert), Ban-Status im Feed, Stadtbeschriftungen und zentrierte Ländernamen auf der Karte.

## 1.3.0 · April 2026
- 🇬🇧 Mobile view reworked; **IP unban** straight from the feed.
- 🇩🇪 Handy-Ansicht überarbeitet; **IP-Unban** direkt aus dem Feed.

## 1.2.5 · April 2026
- 🇬🇧 Auto-zoom on load, favicon, version badge on mobile.
- 🇩🇪 Auto-Zoom beim Laden, Favicon, Versionsanzeige am Handy.

## 1.2.0 · April 2026
- 🇬🇧 Feed search, scenario and country filters, sparkline, country names on the map, dot clustering, 4 themes, sound alarm, **CSV export**.
- 🇩🇪 Feed-Suche, Szenario- und Länderfilter, Sparkline, Ländernamen auf der Karte, Punkt-Bündelung, 4 Themes, Ton-Alarm, **CSV-Export**.

## 1.1.0 · April 2026
- 🇬🇧 City display, auto-fit zoom, reset button; zoom fixes.
- 🇩🇪 Stadtanzeige, Auto-Fit-Zoom, Zurück-Knopf; Zoom-Korrekturen.

## 1.0.0
- 🇬🇧 First version: world map with animated attack arrows, live feed, top 10, IP lookups, DE/EN, mobile bottom sheet.
- 🇩🇪 Erste Version: Weltkarte mit animierten Angriffspfeilen, Live-Feed, Top 10, IP-Abfragen, DE/EN, Handy-Ansicht mit Bottom-Sheet.
