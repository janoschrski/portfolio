# Janosch Rajewski – Portfolio-Website mit Editor

Läuft als **Cloudflare Worker** (Adresse `…workers.dev`).

## Der Editor
Auf der Website auf den **roten Punkt** neben deinem Namen klicken → Passwort → Editor.
Links bearbeitest du, rechts siehst du die Live-Vorschau. **Alles wird automatisch gespeichert** (abschaltbar unter Einstellungen).

**Direkt in der Vorschau (wie bei Canva)**
- **Text anklicken und lostippen.** Die Änderung landet sofort im Editor.
- **Text markieren** → Werkzeugleiste: Fett, Kursiv, Unterstrichen, Textfarbe, Hinterlegen (Marker), Größe, Animation (Marker zieht durch, Linie zeichnet sich, Leuchtet auf, Springt hoch), Link, Formatierung entfernen. Das geht auch in den Textfeldern links.
- **Farbvorschläge:** zuerst die Farben deines Designs und alle Farben, die du schon benutzt hast, darunter weitere und eine eigene Farbe
- **Über einen Abschnitt fahren** → Leiste oben links: ⋮⋮ ziehen zum Verschieben, ↑ ↓, + Element, Duplizieren, Ausblenden, Löschen
- **Über ein Element fahren** → ⋮⋮ ziehen, auch in einen anderen Abschnitt; ↑ ↓ davor/dahinter setzen, Duplizieren, Löschen
- **Über einen Eintrag fahren** (Film, Leistung, Schritt, Zahl, Button, Link, Fotoserie …) → blaue Leiste: ⋮⋮ ziehen, ↑ ↓, Duplizieren, Löschen
- **Was ein Button tut** wählst du bei jedem Button unter „Was passiert beim Klick?“: zu einem Abschnitt springen, Webseite öffnen, E-Mail schreiben, anrufen, Text kopieren (z. B. deine E-Mail-Adresse), Showreel abspielen, Datei herunterladen (PDF/Bild, z. B. Setcard oder Preisliste), Kundenzugang öffnen. Darunter steht immer im Klartext, was passiert. In der Vorschau zeigt der Mauszeiger es auch als Hinweis.
- **Auf einen Button klicken** → Beschriftung, Ziel, Stil (gefüllt/umrandet/nur Text), Größe, Farbe (Design-Farben + schon benutzte + eigene), Button löschen
- **„+ Abschnitt einfügen“** erscheint zwischen den Abschnitten
- Jeder Abschnitt kann **zusätzliche Elemente** bekommen (Buttons, Bild, Zahlen …)

**Seite**
- **In der Vorschau auf irgendetwas klicken** (Überschrift, Text, Button, Zahl, Film-Titel, Name oben, Fußzeile …) → der Editor springt genau zu diesem Feld und markiert es
- Felder sind in Gruppen sortiert: Inhalt, Aussehen, Animation, Menü
- Am Griff **⋮⋮ ziehen** zum Sortieren, das gilt auch für Filme, Leistungen und Fotos
- **+** zwischen zwei Abschnitten (beim Drüberfahren) fügt genau dort etwas ein
- **Schnell einfügen:** Buttons, Bild, Bildergalerie, Video, Zahlen, Bild + Text, Überschrift + Text
- **Freier Bereich:** Elemente frei kombinieren (Überschrift, Text, Buttons, Bild, Video, Galerie, Zahlen, Liste, Zitat, Abstand, Linie). Mit „Breite“ 1/2 oder 1/3 stehen sie nebeneinander.
- Seltene Einstellungen stecken unter „Mehr Optionen“
- Fotos einfach aus dem Finder in den Editor ziehen

**Animationen**
- Pro Abschnitt: Einblenden, von unten/oben/links/rechts, Heranzoomen, aus der Unschärfe, Vorhang
- Elemente nacheinander einblenden (z. B. Fotos einzeln), Tempo wählbar
- Fotos beim Drüberfahren: Zoom, Anheben, S/W → Farbe, andere abdunkeln
- Zahlen zählen beim Einblenden hoch
- „▶ Animation ansehen“ spielt sie in der Vorschau ab

**Einklappen:** Abschnitte mit großer Überschrift (Filme, Fotografie, Leistungen, Ablauf, Video) haben links einen Pfeil. Besucher können damit oder per Klick auf die Überschrift den Abschnitt einklappen. Beim Laden ist immer alles ausgeklappt, ein Klick im Menü klappt den Abschnitt automatisch wieder auf. An/aus unter Design → Animation & Effekte, pro Abschnitt unter Aussehen → Einklappbar.

**Design:** Farbvorlage, Akzentfarbe, Schriften, Animation & Effekte, unter „Feineinstellungen“ alles Weitere.
**Einstellungen:** Name, Google-Beschreibung, Menü, automatisches Speichern, Speicherplatz, Sicherung, Abmelden.
**Rückgängig:** Pfeile oben oder ⌘Z / ⇧⌘Z.

**Entwurf & Veröffentlichen:** Alles, was du im Editor änderst, wird automatisch als **Entwurf** gesichert. Besucher sehen davon nichts. Erst der rote Button **„Veröffentlichen“** oben rechts bringt es online. „Verwerfen“ löscht den Entwurf und zeigt wieder die Online-Fassung. Unter Einstellungen → „Frühere Versionen“ kannst du jede der letzten 20 veröffentlichten Fassungen wieder als Entwurf laden.

**Fotos „Alle ansehen“:** Im Abschnitt Fotografie stellst du ein, wie viele Fotos pro Serie direkt zu sehen sind (Standard 8). Gibt es mehr, erscheint „Alle X Fotos ansehen“ und öffnet ein Fenster mit allen Fotos.

**Kunden / Partner:** „+ Neuer Abschnitt“ → unter „Fertige Abschnitte“ → „Kunden / Partner“. Dort trägst du Namen oder Logos ein (mit Link, wenn du willst).

## Vertrauliche Projekte (NDA, Sperrfrist, Kundenzugang)
Bei jedem Film und jeder Fotoserie unter **„Wer sieht das?“**:
- **Alle:** normal sichtbar
- **NDA-Kachel:** Besucher sehen Titel, Text und Rolle, statt Bild/Video aber eine Kachel „Vertraulich“ mit deinem Hinweis. Bilder und Videos werden Besuchern gar nicht erst geschickt.
- **Nur mit Code:** Nur wer den Zugangscode hat, sieht das Projekt. Wahlweise erscheint für alle anderen eine gesperrte Kachel mit Titel und „Code eingeben“, oder das Projekt ist ganz unsichtbar. Mit **„Link kopieren“** bekommst du einen Link (…/?code=XXXX-XXXX), der das Projekt beim Öffnen sofort freischaltet.
- **Erst sichtbar ab:** Bis zum Datum sehen Besucher das Projekt nicht, danach erscheint es automatisch. Du siehst es im Editor die ganze Zeit (blau markiert).
Ganze Abschnitte haben das Gleiche unter **„Sichtbarkeit“**.

**Projekt-Steckbrief (ohne Video):** Element für Projekte, deren Material du nicht zeigen darfst, die aber jeder sehen soll. Einfügen über „+ Neuer Abschnitt → Projekt ohne Video (NDA)“ oder als Element in jedem Abschnitt. Es enthält: Stand (Unter NDA / In Postproduktion / In Produktion / Release folgt), Titel, Kunde (allgemein formuliert), Beschreibung, deine Rolle, „Was ich gemacht habe“, Zahlen (z. B. Drehtage, Teamgröße), Technik, standardmäßig ohne Bild- oder Video-Kasten. Unter „Mehr Optionen“ kannst du ein erlaubtes Foto oder eine Platzhalter-Kachel ergänzen.

Wichtig: Geschützte Inhalte filtert der Server. Ohne Code kommen sie nicht beim Besucher an, auch nicht im Quelltext.

## Kontaktformular
Das Formular steht im Kontakt-Abschnitt (an/aus und Auswahl-Optionen unter „Inhalt“). Jede Anfrage wird gespeichert und erscheint im Editor unter **„Anfragen“**, auch ohne weitere Einrichtung.

**Damit Anfragen zusätzlich per E-Mail kommen** (einmalig, ca. 5 Minuten):
1. Auf **resend.com** ein kostenloses Konto anlegen, mit genau der E-Mail-Adresse, an die Anfragen gehen sollen.
2. Dort **API Keys → Create API Key** (Berechtigung „Sending access“) und den Schlüssel kopieren.
3. Bei Cloudflare: **Workers & Pages → portfolio → Settings → Variables and Secrets → Add**
   - Type **Secret**, Name `RESEND_API_KEY`, Value: der Schlüssel
   - Type **Text**, Name `CONTACT_TO`, Value: deine E-Mail-Adresse (dieselbe wie bei Resend)
4. Speichern bzw. neu deployen. Im Editor unter „Anfragen“ steht dann „✓ Neue Anfragen werden zusätzlich an … geschickt“.

Mit „Antworten“ in der Mail oder im Editor antwortest du direkt dem Kunden.
Hast du später eine eigene Domain, kannst du sie bei Resend bestätigen und `MAIL_FROM` setzen, z. B. `Website <anfragen@janoschrajewski.de>`.
Hinweis: Die Konditionen von Resend (kostenloses Kontingent) können sich ändern. Prüfe sie beim Anlegen.

## Google & Teilen
Seitentitel, Beschreibung und Vorschaubild stellst du unter **Einstellungen → „Google & Teilen“** ein, inklusive Vorschau, wie dein Link bei WhatsApp & Co. aussieht. Der Server schreibt diese Angaben direkt in die Seite, damit sie auch beim Teilen ankommen. Außerdem gibt es automatisch `robots.txt`, `sitemap.xml`, ein Favicon und Google-Daten („Videograf in Berlin“).
Tipp: Melde die Seite bei der **Google Search Console** an und reiche `…/sitemap.xml` ein.

## Schriften
Alle Schriften liegen im Ordner `public/fonts`. Die Seite baut keine Verbindung zu Google Fonts mehr auf. Das ist datenschutzrechtlich sauberer, und in der Datenschutzerklärung muss Google Fonts nicht mehr erwähnt werden.

## Aufbau
| | |
|---|---|
| `public/` | Die Website: `app.html` (Startseite), `edit.html`, Skripte, `content.json` (Startinhalt), Bilder in `img/` |
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
