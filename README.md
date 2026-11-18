# Atempause

Einmal durchatmen, bevor eine ablenkende Website oder App aufgeht. Gleicher Ablauf wie one sec:
Atemkreis (4 s ein, 5 s aus), dann die Frage, ob du wirklich willst, mit Zähler für heute.
„Weiter“ gibt die Seite oder App für 10 Minuten frei.

- `extension/`: Chrome-Erweiterung (Laptop)
- `docs/`: dieselbe Atemseite als Website für das iPhone, über GitHub Pages:
  `https://palhbg.github.io/atempause/?app=instagram`
- `tools/sync-web.sh`: kopiert die Atemseite aus `extension/` nach `docs/`. Nach jeder Änderung an
  `breathe.*` ausführen.

## Chrome einrichten

1. Ordner `extension/` auf den Laptop holen (Repo klonen oder als ZIP von GitHub laden und entpacken).
2. In Chrome `chrome://extensions` öffnen, oben rechts **Entwicklermodus** einschalten.
3. **Entpackte Erweiterung laden** und den Ordner `extension` wählen.
4. Die Einstellungsseite öffnet sich: Websites eintragen, speichern.
5. one sec in Chrome deaktivieren, sonst atmest du zweimal.

Das Symbol in der Leiste zeigt die Zahlen von heute, die Einstellungen die letzten 7 Tage.

## iPhone einrichten

Apple lässt keine App andere Apps abfangen. Deshalb läuft es wie bei one sec über die
Kurzbefehle-App: zwei Kurzbefehle plus eine Automation pro App.

### Kurzbefehl 1: „Atempause“

Neuer Kurzbefehl, Name genau `Atempause`. Im Info-Bereich (i) **Eingabe empfangen: Text**.

1. **Datei aus Ordner abrufen**: Ordner `Shortcuts`, Pfad `atempause/` + Variable
   *Kurzbefehleingabe* + `.txt`. **Fehler, wenn nicht gefunden** ausschalten.
2. **Wenn** *Datei* **hat einen Wert**:
   1. **Daten aus Eingabe abrufen** (Eingabe: *Datei*).
   2. **Zeit zwischen Datumsangaben abrufen**: zwischen *Daten* und *Aktuelles Datum*, in **Minuten**.
   3. **Wenn** *Zeit zwischen Datumsangaben* **ist kleiner als** `10`: **Kurzbefehl stoppen**.
3. **URL öffnen**: `https://palhbg.github.io/atempause/?app=` + *Kurzbefehleingabe*

### Kurzbefehl 2: „Atempause Weiter“

Neuer Kurzbefehl, Name genau `Atempause Weiter`. **Eingabe empfangen: Text**.

1. **Aktuelles Datum**.
2. **Datum formatieren**: Format **ISO 8601**.
3. **Datei sichern**: Ordner `Shortcuts`, Unterpfad `atempause/` + *Kurzbefehleingabe* + `.txt`,
   **Fragen, wo gesichert werden soll** aus, **Überschreiben** an.

Die Atemseite ruft diesen Kurzbefehl bei „Weiter“ auf und öffnet danach die App.

### Automation pro App

Kurzbefehle, Tab **Automation**, **+**, **App**:

1. App wählen (z. B. Instagram), **Wird geöffnet**, **Sofort ausführen**, Benachrichtigung aus.
2. Aktion **Text**: `instagram`
3. Aktion **Kurzbefehl ausführen**: `Atempause`, Eingabe: *Text*.

Für jede weitere App wiederholen. Bekannte Kürzel: `instagram`, `tiktok`, `youtube`, `x`,
`facebook`, `reddit`, `linkedin`, `whatsapp`, `snapchat`, `netflix`, `spiegel`. Für eine andere App
den URL-Aufruf erweitern: `?app=strava&name=Strava&scheme=strava://`.

Danach one sec auf dem iPhone für dieselben Apps abschalten.

### Hinweise

- Die Freigabezeit steht zweimal: im Kurzbefehl (`10` in Schritt 2.3) und auf der Seite. Wer sie
  ändert, ändert beide und hängt an die URL `&grace=15` an.
- Die Zähler auf dem iPhone liegen im Safari-Speicher dieser Seite; „Websitedaten löschen“ setzt sie zurück.
- Jeder Aufruf öffnet einen Safari-Tab. Safari, Einstellungen, **Tabs schließen: nach einem Tag** hält das sauber.
