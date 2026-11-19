# Atempause

Take one breath before a distracting website or app opens. Same flow as one sec: a breathing
circle (4 s in, 5 s out), then the question whether you really want to, with today's count.
"Continue" lets the site or app through for 1 minute.

- `extension/`: Chrome extension (laptop)
- `docs/`: the same breathing page as a website for the iPhone, via GitHub Pages:
  `https://palhbg.github.io/atempause/?app=youtube`
- `tools/sync-web.sh`: copies the breathing page from `extension/` to `docs/`. Run it after every
  change to `breathe.*`.

## Chrome setup

One-time, in PowerShell on the laptop:

```powershell
irm https://raw.githubusercontent.com/palHBG/atempause/main/tools/windows-setup.ps1 | iex
```

It puts a git checkout in `%USERPROFILE%\CLAUDE\code\atempause` (installs Git via winget if
missing) and an **Update Atempause** shortcut on the desktop. Double-click it after a change: it
pulls from GitHub, and the extension notices the new version on disk within a minute and reloads
itself. Nothing to unpack or reload by hand.

Then, once: `chrome://extensions`, **Developer mode** on, **Load unpacked**, choose the
`extension` folder inside that checkout. Turn off one sec in Chrome.

On the breathing page a slider (1 to 15 minutes) sets how long the site stays open. When the time
is up, every open tab of that site goes back to the breathing page, even mid-video. The settings
page sets the slider's starting value; the page remembers your last choice.

Development (on the server): `cp tools/pre-commit .git/hooks/pre-commit` once. The hook copies the
breathing page to `docs/` and bumps the patch version whenever `extension/` changes, which is what
the laptop's extension watches for.

## iPhone setup

Apple does not let an app intercept other apps, so this works like one sec does: through the
Shortcuts app. Two shortcuts plus one automation per app.

### Shortcut 1: "Atempause"

New shortcut, named exactly `Atempause`. In its details (i), turn on **Receive: Text** input.

1. **Get File from Folder**: folder `Shortcuts`, path `atempause/` + variable *Shortcut Input* +
   `.txt`. Turn off **Error If Not Found**.
2. **If** *File* **has any value**:
   1. **Get Dates from Input** (input: *File*).
   2. **Get Time Between Dates**: between *Dates* and *Current Date*, in **Minutes**.
   3. **If** *Time Between Dates* **is less than** `1`: **Stop This Shortcut**.
3. **Current Date**, **Format Date** as ISO 8601 (with time), **Save File** to `Shortcuts`, subpath
   `atempause/` + *Shortcut Input* + `.txt`, Ask Where to Save off, Overwrite on.
4. **Open URLs**: `https://palhbg.github.io/atempause/?app=` + *Shortcut Input* + `&direct=1`

With `&direct=1`, "Continue" jumps straight into the app via its web link, so the Shortcuts app
does not flash up. The free minute then counts from the moment the pause starts. Shortcut 2 below
is only needed without `&direct=1`.

### Shortcut 2: "Atempause Continue"

New shortcut, named exactly `Atempause Continue`. **Receive: Text** input.

1. **Current Date**.
2. **Format Date**: format **ISO 8601**.
3. **Save File**: folder `Shortcuts`, subpath `atempause/` + *Shortcut Input* + `.txt`,
   **Ask Where to Save** off, **Overwrite If File Exists** on.

The breathing page runs this shortcut on "Continue" and then opens the app.

### One automation per app

Shortcuts, **Automation** tab, **+**, **App**:

1. Choose the app (e.g. YouTube), **Is Opened**, **Run Immediately**, notification off.
2. Action **Text**: `youtube` (for Facebook: `facebook`)
3. Action **Run Shortcut**: `Atempause`, input: *Text*.

Repeat for each app. Known keys: `instagram`, `tiktok`, `youtube`, `x`, `facebook`, `reddit`,
`linkedin`, `whatsapp`, `snapchat`, `netflix`, `spiegel`. For any other app extend the URL:
`?app=strava&name=Strava&scheme=strava://`.

Then turn off one sec on the iPhone for the same apps.

### Notes

- The free-pass time lives in two places: the shortcut (`1` in step 2.3) and the page. To change
  it, change both and append `&grace=5` to the URL.
- The iPhone counters live in Safari's storage for this page; clearing website data resets them.
- Every pause opens a Safari tab. Safari settings, **Close Tabs: After One Day** keeps that tidy.
