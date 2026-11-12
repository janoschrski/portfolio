# Janosch Rajewski – Portfolio-Website mit Editor

Läuft als **Cloudflare Worker** (Adresse `…workers.dev`). Funktioniert genauso auch als Cloudflare Pages.

## Aufbau
| | |
|---|---|
| `public/` | Die Website: `index.html`, `edit.html` (Editor), `api.js`, `content.json`, Bilder in `img/` |
| `worker.js` | Startet den Server-Teil (Login, Speichern, Uploads, Videos) |
| `wrangler.jsonc` | Cloudflare-Einstellungen (Name `portfolio`, R2-Bucket `janosch-media`) |
| `functions/`, `lib/` | Die einzelnen Server-Funktionen |

## Einrichtung bei Cloudflare (Worker)

### 1. R2-Speicher anlegen (für Fotos, Videos und deine Texte)
1. dash.cloudflare.com → links **R2 Object Storage**. Beim ersten Mal musst du R2 aktivieren, dafür will Cloudflare eine Zahlungsmethode. Bis 10 GB ist es kostenlos.
2. **Create bucket** → Name genau: `janosch-media` → **Create bucket**.

### 2. Dateien auf GitHub
Den **Inhalt** dieses Ordners ins Repository hochladen: `public`, `functions`, `lib`, `worker.js`, `wrangler.jsonc`.
Danach baut Cloudflare die Seite automatisch neu (dauert ca. 1 Minute).

### 3. Passwort festlegen
**Workers & Pages** → Projekt **portfolio** → **Settings** → **Variables and Secrets** → **Add**
- Type: **Secret**
- Name: `ADMIN_PASSWORD`
- Value: dein Passwort
→ **Deploy** bzw. **Save**.

### 4. Testen
Website öffnen → roter Punkt → Passwort. Im Editor darf oben **kein gelber Hinweis** stehen.
YouTube-Link einfügen, speichern, Website ansehen: Das Video läuft direkt im Film-Kasten.

### Falls es nicht klappt
- **Projekt → Deployments**: Steht beim neuesten Eintrag ein Fehler? Häufig: Der Bucket heißt nicht genau `janosch-media`.
- Heißt dein Projekt bei Cloudflare nicht `portfolio`, ändere in `wrangler.jsonc` die Zeile `"name"` auf den Projektnamen.

## Passwort ändern
Projekt → **Settings → Variables and Secrets** → `ADMIN_PASSWORD` → **Edit**. Alle bestehenden Logins werden ungültig.

## Gut zu wissen
- Ein Login hält 12 Stunden.
- Bei jedem Speichern wird die vorige Version als Sicherung abgelegt (im Bucket unter `data/content-backup.json`).
- Videos über 90 MB werden automatisch in Stücken hochgeladen, auch mehrere GB. Für flüssiges Abspielen als MP4 (H.264, 1080p) exportieren. Für lange Filme ist ein YouTube-Link meist besser.
- YouTube-Videos laden erst nach Klick über `youtube-nocookie.com`. YouTube, Google Fonts und Cloudflare gehören in die Datenschutzerklärung.
- Lokal testen (optional, braucht Node.js): `npx wrangler dev`, Passwort lokal: `npx wrangler dev --var ADMIN_PASSWORD:test`
