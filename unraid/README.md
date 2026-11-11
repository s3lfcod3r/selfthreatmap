# Unraid Community Applications Template

## Für Nutzer — manuell hinzufügen

Falls das Template noch nicht in CA gelistet ist:

1. Unraid → **Apps** → oben rechts **"..." → "Add"**
2. URL eintragen:
   ```
   https://raw.githubusercontent.com/s3lfcod3r/unraid-templates/main/templates/selfthreatmap.xml
   ```
3. Speichern → in CA nach "CrowdSec" suchen

---

## Icon

Das `icon.png` wird von CA als App-Icon angezeigt.
Empfohlene Größe: **128×128px PNG**, freigestelltes Shield-Icon in Cyan (#00ffe0).

Falls kein Icon vorhanden, fällt CA auf das Docker-Image-Label zurück.

---

## Community Applications

Das Template liegt in [s3lfcod3r/unraid-templates](https://github.com/s3lfcod3r/unraid-templates/blob/main/templates/selfthreatmap.xml) und ist von dort in Community Applications gelistet. Änderungen am Template nur dort.

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
