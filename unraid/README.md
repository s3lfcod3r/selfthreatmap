# Unraid Community Applications Template

## Für Nutzer — manuell hinzufügen

Falls das Template noch nicht in CA gelistet ist:

1. Unraid → **Apps** → oben rechts **"..." → "Add"**
2. URL eintragen:
   ```
   https://raw.githubusercontent.com/s3lfcod3r/selfthreatmap/main/unraid/selfthreatmap.xml
   ```
3. Speichern → in CA nach "CrowdSec" suchen

---

## Icon

Das `icon.png` wird von CA als App-Icon angezeigt.
Empfohlene Größe: **128×128px PNG**, freigestelltes Shield-Icon in Cyan (#00ffe0).

Falls kein Icon vorhanden, fällt CA auf das Docker-Image-Label zurück.

---

## Offiziell in CA eintragen (für Maintainer)

Um das Template offiziell in Community Applications zu listen:

1. Fork von [Squidly271/CA_AutoUpdate_Apps](https://github.com/Squidly271/CA_AutoUpdate_Apps) erstellen
2. Repo-URL zu `data/plugins.json` hinzufügen
3. Pull Request stellen

Alternativ: im [Unraid Forum](https://forums.unraid.net/forum/35-docker-containers/) einen Thread erstellen und CA-Maintainer (@Squid) taggen.

---

## Template-Felder Übersicht

| Feld | Wert |
|------|------|
| Pflicht-Variablen | `SERVER_LAT`, `SERVER_LON`, `SERVER_NAME` |
| CrowdSec-LAPI (für Unban) | `CROWDSEC_LAPI_URL`, `CROWDSEC_LAPI_MACHINE_ID`, `CROWDSEC_LAPI_PASSWORD` |
| Optionale Variablen | `WHITELIST_ENABLED`, `WHITELIST_INTERVAL`, `CACHE_TTL`, `DAYS_BACK` |
| Ports | `8080` (Dashboard) |
| Volumes | `/config` (rw), `/crowdsec/data` (ro), `/crowdsec/postoverflows` (rw) — **kein Docker-Socket** |

### Update von ≤ 3.0.0

Ab 3.1.0 läuft das Unban über die CrowdSec Local API statt über den Docker-Socket:

1. Im CrowdSec-Container eine Maschine anlegen: `cscli machines add selfthreatmap --password 'LANGES-PASSWORT' -f /dev/null`
2. Im Template `CROWDSEC_LAPI_URL` (z. B. `http://192.168.1.7:8080`), `CROWDSEC_LAPI_MACHINE_ID` und `CROWDSEC_LAPI_PASSWORD` setzen.
3. Die alte Pfad-Zuordnung `/var/run/docker.sock` und `--group-add 999` (Extra Parameters) entfernen.
