# 🛡️ SelfThreatMap — Changelog

---

## v2.9.0 — 29.06.2026

### 🧙 Setup-Assistent + Einstellungen statt ENV-Secrets
- **Ersteinrichtung im Browser**: Beim ersten Aufruf legt man Benutzer + Passwort selbst an ([`setup.html`](setup.html)) — keine Zugangsdaten mehr im Unraid-Template / in ENV-Variablen.
- **Einstellungen-Seite** ([`settings.html`](settings.html), erreichbar unter `/settings`): Passwort ändern und **2FA optional per QR-Code** aktivieren/deaktivieren. QR-Code lokal erzeugt (gebündelte MIT-Lib `assets/vendor/qrcode.min.js`, kein CDN). Login zeigt das 2FA-Feld nur, wenn 2FA aktiv ist.
- **Persistenz im `/config`-Volume** (`auth.json`): Konto + 2FA + Session-Schlüssel überleben Container-Updates. **Wichtig: `/config` als Volume mounten.** Damit entfällt das alte „Secrets bei Neustart weg"-Problem komplett.
- `auth.py` auf Datei-Store umgebaut (Konto-Verwaltung, optionales TOTP); neue Endpunkte `/auth/setup`, `/auth/status`, `/auth/password`, `/auth/2fa/init|enable|disable`, `/settings`. nginx: `/auth/`-Prefix + geschützte `/settings`.
- **Template/Compose vereinfacht**: nur noch `AUTH_ENABLED` + `COOKIE_SECURE` + `/config`-Volume; `ADMIN_*`/`TOTP_SECRET`/`SESSION_SECRET` entfernt. Auth-Flow lokal getestet (Setup/Login/2FA an+aus/Session/Persistenz grün).

---

## v2.8.0 — 29.06.2026

### 🔐 Login + Zwei-Faktor (2FA) — Dashboard-Zugangsschutz
- Das **gesamte Dashboard** ist jetzt durch **Benutzername + Passwort + TOTP-2FA** geschützt (`AUTH_ENABLED=true` als Standard). Umsetzung mit nginx `auth_request` vor allen Seiten/Endpunkten + signierter Session-Cookie (HttpOnly/SameSite=Strict). Reine Python-stdlib, kein zusätzlicher Dienst nötig. Neue Dateien: [`auth.py`](auth.py), [`login.html`](login.html).
- Beim **ersten Start** werden Zufallspasswort + 2FA-Secret (inkl. `otpauth://`-Link) **einmalig ins Container-Log** geschrieben — danach in `ADMIN_PASSWORD` / `TOTP_SECRET` / `SESSION_SECRET` festsetzen.
- **Brute-Force-Schutz**: Login-Rate-Limit (nginx) + IP-Lockout nach 5 Fehlversuchen (15 min).

### 🛡️ Security-Härtung (Audit-Befunde behoben)
- **Unban fail-closed**: ohne gültige Login-Session **kein** Unban mehr (vorher: ohne Token offen für jeden im Netz).
- **Exporter bindet nur noch lokal** (`127.0.0.1` statt `0.0.0.0`) — andere Container erreichen die API nicht mehr direkt.
- **XSS behoben**: alle Backend-Felder (IP, Szenario, ASN, Stadt, IP-Range) werden in Feed/Tooltip/Panels/Herkünfte konsequent escaped; Inline-`onclick` mit interpolierten Daten durch sichere `data`-Attribute + zentrale Event-Delegation ersetzt.
- **CORS** `*` von allen API-Endpunkten entfernt (Same-Origin über nginx-Proxy).
- **CSP**-Header + `Permissions-Policy` + `X-Frame-Options: DENY` ergänzt; Rate-Limit auf `/unban`.
- **Kein Token mehr im HTML** (Unban läuft über die Session), generische Fehlermeldungen statt Stacktraces/DB-Pfaden, `SERVER_NAME` wird vor dem Einsetzen bereinigt.
- Docker-Socket-Risiko im Compose/Template klar dokumentiert (Socket-Proxy als Härtung empfohlen).

---

## v2.7.2 — 28.06.2026

### 🎨 Herkünfte-Punkte farbig
- Die Punkte im HERKÜNFTE-Overlay sind jetzt nach Angriffszahl gefärbt: grün (wenig) → gelb → orange → rot (viele) — nutzt dieselbe Skala wie die Legende.

---

## v2.7.1 — 28.06.2026

### 🗺️ HERKÜNFTE-Overlay: übersichtlich & ohne Überlappung
- **Kollisionsschutz** für die Labels: bei kleinem Zoom (z. B. 1,1×) überlagern sie sich nicht mehr — nur die wichtigsten Länder (nach Anzahl) werden beschriftet, der Rest bleibt als Punkt sichtbar.
- **Level-of-Detail beim Reinzoomen**: ab Zoom 4× erscheinen die **Stadtnamen** (wo du hergegriffen wurdest), ebenfalls überlappungsfrei. Punkte kleiner & in konstanter Bildschirmgröße.
- Flüssiges Zoomen (Render auf 1×/Frame gedrosselt). Im Browser verifiziert: 0 überlappende Labels bei 1,1× **und** 5×.

---

## v2.7.0 — 28.06.2026

### 🗺️ „HERKÜNFTE"-Karten-Overlay (live)
- Neuer Schalter **HERKÜNFTE** in der Toggle-Leiste: plottet **jedes Land, aus dem du je angegriffen wurdest, als Punkt auf der Karte** (Größe = Anzahl), dauerhaft mit Ländername + Zahl beschriftet. Aktualisiert sich **live** (über `renderDots`). Zustand gemerkt. Code: `assets/js/origins.js`.

### 💾 Profil bleibt nach Reload
- Das gewählte Profil (z. B. „Bernstein", „Matrix-Modus") wird im Browser gespeichert und beim Neuladen **automatisch wiederhergestellt** (inkl. Theme, Stil, Schalter, Dichte).

---

## v2.6.0 — 28.06.2026

### 🗺️ Angriffs-Herkünfte-Übersicht
- Klick auf das **„LÄNDER"-Stat** im Kopf öffnet eine Gesamt-Übersicht: **jedes Land**, aus dem du je angegriffen wurdest, als sortierte Rangliste (Flagge, Anzahl, Balken) — plus **Top-Städte**. Basiert auf allen geladenen Angriffen. Code: `assets/js/origins.js`. Im Browser verifiziert.

### 💄 Obere Steuerzeile aufgeräumt
- Das Profil-Dropdown bekommt eine **eigene Zeile** (volle Breite), darunter THEMA + Sprache + Einstellungen — vorher gedrängt/umgebrochen.

---

## v2.5.1 — 28.06.2026

### 🐛 Fix: Profil-Dropdown ließ sich nicht ausklappen
- Auf der laufenden Instanz wurde das Profil-Panel beim Start nicht befüllt (0 Einträge) → Klick zeigte nichts
- Jetzt **Selbst-Init** in `profiles.js` (wie beim Raketen-Stil-Select) **+ Lazy-Build**: klickt man auf das Profil-Dropdown und es ist leer, wird es sofort gebaut. An der Live-Instanz reproduziert, Fix im Browser verifiziert (54 Profile bauen & öffnen).

---

## v2.5.0 — 28.06.2026

### 🎛️ 50+ Profile (Voreinstellungen)
- Neues **Profil-Dropdown** oben (wie Theme/Sprache) mit **54 Voreinstellungen** in 7 Gruppen — ein Klick setzt Bahn-Stil + Theme + Animation + Angriffe an/aus + Auto-Zoom + Spawn-Modus + Dichte auf einmal
- Beispiele: „Alle Angriffe (Console)", „Alle Angriffspunkte" (statisch), „Maximale Action", „Kometen-Regen", „Laser-Show", „Matrix-Modus", „Cyberpunk", „Brute-Force-Jagd", „Kino-Modus", „Performance-schonend" u. v. m.
- Code: `assets/js/profiles.js` — leicht erweiterbar; im Browser verifiziert (alle Profile setzen korrekt Stil/Theme/Schalter/Dichte)

### 🏙️ Stadtnamen bis zum Maximalzoom
- Fix: Städtenamen verschwanden bei exakt 25× (Maximalzoom), weil das Gate `>=` war. Jetzt `>` → Namen bleiben bis ganz nah sichtbar. Default „bis Zoom" auf **25** angehoben.

---

## v2.4.1 — 27.06.2026

### 🏙️ Stadtnamen-Zoom bis 25
- „Stadtnamen ab/bis Zoom" geht jetzt bis **25** (vorher 8) — passt zum tatsächlichen Karten-Maximalzoom (25×). Auf 25 gesetzt bleiben die Namen auch beim ganz nah Reinzoomen sichtbar.

---

## v2.4.0 — 27.06.2026

### 📦 Offline-fähig (kein CDN mehr)
- **d3, topojson & Weltkarten-Daten lokal gebündelt** (`assets/vendor/`) statt von cloudflare/jsdelivr — läuft jetzt **ohne Internet**, schneller, kein Datenabfluss an Dritte. (Live verifiziert: 177 Länder gezeichnet, 0 CDN-Requests.)

### ⚡ `/metrics` komprimiert
- nginx `gzip_proxied any;` — proxied Antworten (`/metrics`, `/drops`, `/config`) werden jetzt gzip-komprimiert (vorher nicht). Deutlich weniger Übertragung pro Refresh.

### 📱 Sprach-Umschalter am Handy
- Der 12-Sprachen-Wähler ist jetzt auch in der mobilen Leiste (Dropdown), synchron mit dem Desktop-Wähler.

### ♿ Pinch-Zoom erlaubt
- Viewport blockiert das Hineinzoomen am Handy nicht mehr (`user-scalable=no` entfernt).

---

## v2.3.2 — 27.06.2026

### 🐛 Fix: Sprach- & Theme-Dropdown ließen sich nicht öffnen
- `#theme-row` hatte `overflow:hidden` → die aufklappenden Panels (Sprache **und** Theme) wurden direkt unter der Zeile abgeschnitten, Klicks landeten auf den Tabs darunter — man konnte keine andere Sprache wählen
- Auf `overflow:visible` geändert; an der laufenden Instanz reproduziert und der Fix per echtem Klick verifiziert (DE → FR live)

---

## v2.3.1 — 27.06.2026

### 🛡️ Echtes Self-Schild
- Header-Logo, Favicon & README nutzen jetzt das **echte facettierte Self-Schild** aus dem Brand-Kit (transparent, `assets/logo/shield.png`) statt der nachgezeichneten Version
- **Docker/Unraid-Container-Icon** = offizielles Self-Avatar (Schild auf Dunkel + Teal-Glow, 512×512)

---

## v2.3.0 — 27.06.2026

### 🔥 Live Firewall Drops — `/drops` API (aus Railline-Fork portiert)
- Optionale **`/drops`-JSON-API** im Exporter (`DROPS_ENABLED=true`), liest eine gemountete `drops.jsonl` (eine Zeile = ein von der Firewall verworfenes Paket), mit Geo-Anreicherung (MMDB/Geo-Lookup), Alters-/Mengen-Limits
- nginx-Route `/drops`, docker-compose- & Unraid-Template-Optionen (Verzeichnis + Variablen), standardmäßig **aus**
- Backend kompiliert (`py_compile`); visuelles Drops-Panel folgt separat

---

## v2.2.0 — 27.06.2026

### 🌐 12 europäische Sprachen + In-App-Umschalter
- Oberfläche jetzt in **12 Sprachen**: DE, EN, FR, ES, IT, PT, NL, PL, SV, DA, CS, EL
- Neuer **Flaggen-Dropdown** im Dashboard zum Live-Umschalten; Wahl wird im Browser gemerkt (`localStorage`), Docker-`LANGUAGE` bleibt Standard
- Übersetzungen in `assets/i18n/eu-languages.js` (alle Keys konsistent, im Browser getestet)

---

## v2.1.3 — 27.06.2026

### 🐛 Fix: Einstellungs-Vorschau
- Die Live-Vorschau des Bahn-Stils fror nach dem ersten Bild ein (zeigte immer dieselbe Rakete) — die Animations-Schleife wurde fälschlich gestoppt
- Schleife läuft jetzt durch und liest den gewählten Stil live; im Browser getestet (legacy/morse/rakete zeichnen korrekt unterschiedlich)

---

## v2.1.2 — 27.06.2026

### 🎚️ Theme-Dropdown
- Die 10 Farbthemen sitzen jetzt in einem platzsparenden **Aufklapp-Menü** (statt 3 Button-Reihen)

### 🏙️ Stadtnamen-Zoom konfigurierbar
- Neue Einstellungen **„Stadtnamen ab/bis Zoom"** (Karte/Server) — selbst festlegen, in welchem Zoombereich Städtenamen sichtbar sind
- Tipp: „bis Zoom" auf 8 → Namen bleiben auch beim ganz nah Reinzoomen sichtbar (vorher fix bei 5 ausgeblendet)

---

## v2.1.1 — 27.06.2026

### 🎨 Branding-Feinschliff
- **Docker/Unraid-Icon** als echtes 512×512-PNG (Self-Schild mit Glow) — `unraid/icon.png`
- **Header-Wortmarke** in echten Self-Farben: „Self" Ice (#9dbdd0), „ThreatMap" Teal (#33a78c), Orbitron 800; Logo-Mark als sauberes Self-Schild + Threat-Ping

### 👁️ Live-Vorschau in den Einstellungen
- Neues Vorschau-Canvas unter der Stil-Auswahl: zeigt den gewählten Bahn-Stil **animiert**, sofort beim Umschalten — man sieht direkt, wie der Angriff fliegt

---

## v2.1.0 — 27.06.2026

### 🎨 Logo & Wortmarke
- Eigenes SelfThreatMap-Logo (Self-Schild mit Globus-/Radar-Motiv + Angriffs-Ping): `assets/logo/selfthreatmap-mark.svg` + `-logo.svg`
- Logo-Mark im Karten-Header neben dem Schriftzug; README mit Logo

### 🌈 10 Farbthemen
- `THEMA`-Umschalter erweitert: Cyan, Alarm, Matrix, Amber **+ Arctic, Cyber, Inferno, Mono, Synth, Ocean**
- Buttons brechen sauber um (Desktop + Mobile), alle live umschaltbar

### 🔁 Loop-Modus (Replay-Schleife)
- Neuer ⟳-Button in der Replay-Leiste: Zeitfenster läuft endlos in Schleife
- Zustand wird gespeichert (localStorage); am Fensterende automatischer Neustart

---

## v2.0.0 — 27.06.2026

### 🎨 Rebrand → SelfThreatMap (Self-Suite)
- Neues Branding: Logo „SelfThreatMap", Self-Design-Tokens (Teal/Cyan), Favicon
- Image: `ghcr.io/s3lfcod3r/selfthreatmap`, Unraid-Template `selfthreatmap.xml`
- README zweisprachig (DE/EN) + Badges

### 🚀 Über 30 Bahn-Stile (Flight-path styles)
- Neue Stil-Engine `assets/js/rocket-styles.js` mit 30+ umschaltbaren Animationen
  (Rakete, Komet, Laser, Partikel-Strom, Bögen, Einschlag-Ring, Hologramm u. v. m.)
- Stil-Dropdown nach Gruppen sortiert; **Standard jetzt: Rakete**
- Schnell-Umschalter zyklt durch alle Stile

*Basiert auf der CrowdSec Threat Map — gesamte Backend-/Karten-Funktionalität unverändert übernommen.*

---

## v1.5.0 — 25.05.2026

### 🗺️ Console-style Attack Map
- Replay mit Timeline, **24H / 48H**, **0.5× / 1× / 2×**
- Raketen-Animation, Farben nach Bedrohungsart
- Karten-Overlays + Footer-Stats, LIVE-Toggle
- Fix: `active_ban` im Feed

---

## v1.4.3 — 21.05.2026

### 🔒 Security (Issue #3)
- **IP-Validierung** für `/unban` und dynamische Whitelist (`ipaddress`)
- **Optionaler `UNBAN_API_TOKEN`** — Header `X-API-Token` oder `Authorization: Bearer`
- **Kein CORS** mehr auf `/unban` (CSRF-Risiko reduziert)
- **`CROWDSEC_RESTART_COOLDOWN`** — mindestens 300s zwischen automatischen CrowdSec-Neustarts
- README: Abschnitt „Sicherheit“ mit Homelab-Empfehlungen

---

## v1.4.1 — 22.04.2026

### 〰️ Linien-Toggle
- Neuer **LINIE**-Button in Desktop-Sidebar und Mobile-Tab-Leiste
- Blendet alle Angriffspfeile UND die drei Radar-Ringe um den Serverstandort ein/aus
- Der blaue Serverstandort-Punkt selbst bleibt immer sichtbar
- Bugfix: statische Linien (`ANIM AUS`) wurden durch undefinierte `arcsVisible`-Variable nie gezeichnet — jetzt durch `linesOn=true` ersetzt und korrekt initialisiert

### 🛡️ Dynamische IP-Whitelist (eingebaut im Exporter)
- Neuer Hintergrund-Thread im Exporter — läuft alle 15 Minuten automatisch
- Ermittelt die aktuelle öffentliche IP (ifconfig.me / ipify / amazonaws als Fallback)
- Bei IP-Änderung: Whitelist-YAML neu schreiben → CrowdSec neustarten → alten Ban entfernen
- Bei unveränderter IP: trotzdem prüfen ob ein aktiver Ban existiert und ggf. entfernen
- Neue Konfigurationsvariablen: `WHITELIST_ENABLED`, `WHITELIST_FILE`, `WHITELIST_INTERVAL`
- Neuer Endpunkt `/whitelist-status` gibt aktuellen Status als JSON zurück
- **Whitelist-Badge** im Dashboard: Desktop (Sidebar unten) + Mobile (Stats-Leiste)
  - 🟢 Grün = IP unverändert, ok
  - 🔵 Cyan = IP wurde aktualisiert
  - 🔴 Rot = Fehler
- `ConnectionResetError` (Browser schließt Tab während Request läuft) wird jetzt still unterdrückt

### 📐 Responsive Controls
- Alle Buttons in der Kontrollzeile schrumpfen mit der Fenstergröße (`flex-shrink:1`, `clamp`)
- `THEME:`-Label verschwindet automatisch wenn die Sidebar zu schmal wird (ResizeObserver, < 210px)
- Theme-Buttons füllen die verfügbare Breite gleichmäßig aus
- Font-Größen aller Controls per `clamp` an Viewport-Breite angepasst

---

## v1.4.0 — 21.04.2026

### 🔓 Unban komplett überarbeitet
- Unban löscht jetzt **beide** — `decisions` UND `alerts` (`cscli decisions delete` + `cscli alerts delete`)
- Damit verschwindet die IP auch nach Exporter-Neustart dauerhaft aus dem Feed
- `localUnbanned` Set im Frontend verhindert Wiederanzeige innerhalb der Session

### 🚫📋 Ban-Status-Anzeige im Feed
- Neues `active_ban` Label im Exporter — erkennt ob noch eine aktive Decision existiert
- **🚫** (leuchtend) = aktiver Ban vorhanden — Klick entsperrt Decision + Alert
- **📋** (ausgegraut) = nur Alert/Historie — kein aktiver Ban mehr, nur Eintrag löschen
- Tooltip erklärt was beim Klick passiert
- Beide Icons immer sichtbar, das nicht zutreffende ist transparent ausgegraut

### 🗺️ Karten-Verbesserungen
- **Stadtname-Labels** beim Reinzoomen — erscheinen ab Zoom-Level 2.0, einmal pro Stadt
- **Ländernamen zentriert** in der Landesmitte (statt am Angriffspunkt)
- `city` Label jetzt auch in `cs_attack_flow` Metriken

### ⚙️ Exporter-Verbesserungen
- `active_ban` Field in `cs_lapi_realtime` Metriken
- `city` Field in `cs_attack_flow` Metriken
- Unban-Endpunkt führt jetzt beide Delete-Befehle aus

---

## v1.3.0 — 21.04.2026

### 📱 Mobile komplett überarbeitet
- Karte zoomt beim Laden automatisch auf alle Angriffspunkte (Auto-Fit mit Minimum-Zoom)
- Kein Leerraum mehr zwischen Legende und Feed-Sheet
- Feed-Bereich füllt jetzt den gesamten verfügbaren Platz aus
- Legende zentriert, kompakt in einer Zeile
- `KLICK AUF PUNKT = DETAILS` auf Mobile ausgeblendet

### 🔓 IP-Unban direkt aus dem Feed
- Neuer 🔓-Button bei jedem Feed-Eintrag
- Doppelte Bestätigung vor dem Entsperren
- Unban läuft via `docker exec crowdsec cscli decisions delete --ip`
- Erfolg/Fehler wird direkt im Button angezeigt
- Feed wird nach erfolgreichem Unban automatisch neu geladen

---

## v1.2.5 — 21.04.2026

- Auto-Zoom auf alle sichtbaren Angriffspunkte beim Laden
- Favicon (Shield-Icon in Cyan)
- Version-Badge auf Mobile sichtbar

---

## v1.2.0 — 20.04.2026

### ✨ Neue Features
- 🔍 **Feed-Suche** — Echtzeit-Filter nach IP, Land, Stadt, Szenario, ASN
- ⚡ **Szenario-Filter** — Klick auf Szenario filtert Karte + Feed
- 🌍 **Land-Filter** — Klick in Top 10 filtert alles auf ein Land
- 🏷️ **Filter-Chips** — aktive Filter als klickbare Badges mit ✕ zum Entfernen
- 📊 **Sparkline** — Angriffe/Stunde als Minidiagramm im Feed-Tab
- 🗺️ **Ländernamen auf der Karte** — zoomskaliert, in Akzentfarbe
- 🫧 **Dot-Clustering** — nahe Punkte zusammengefasst, verschwindet beim Reinzoomen
- 🎨 **4 Farbthemen** — Cyan (Standard) / Alarm-Rot / Matrix-Grün / Amber
- 🔊 **Sound-Alarm** — optionaler Piepton bei neuen 20+-Angriffen
- 📥 **CSV-Export** — kompletten Feed als Datei herunterladen

### 🎨 Design
- Header entfernt — Titel und Stats direkt in der Sidebar
- Titel permanent auf der Karte zentriert oben
- Theme-Buttons als eigene Zeile in der Sidebar

---

## v1.1.0 — 20.04.2026

### ✨ Neue Features
- Stadt-Anzeige im Feed, Tooltip und Context-Menü
- Auto-Fit Zoom beim ersten Laden
- ⌂-Reset-Button springt zur Fit-Ansicht zurück
- `scaleExtent` auf `[0.1, 25]` für Weltkarten-Zoom möglich

### 🐛 Bugfixes
- Cluster-Größe beim Reinzoomen korrigiert
- Karte verschwindet beim Reinzoomen nicht mehr

---

## v1.0.0 — Initiale Version

### 🚀 Features
- Weltkarte mit animierten Angriffspfeilen (D3.js NaturalEarth-Projektion)
- Live-Feed mit Pagination (20 Einträge/Seite)
- Top 10 / Alle Länder in der Sidebar
- Zoom, Pan, Dot-Klick mit Context-Menü
- IP-Lookups: CrowdSec CTI, Shodan, Censys, RIPE, RIPEstat, Criminal IP
- Sprache DE/EN umschaltbar
- Animations-Toggle (Arc-Pfeile)
- Farbcodierung nach Angriffsanzahl (Grün / Gelb / Orange / Rot)
- Mobile Bottom-Sheet mit Feed, Top 10, Alle

---

© s3lfcod3r | https://github.com/s3lfcod3r/selfthreatmap
GPL-3.0
