# Companion App Windows Start Guide

Windows may block `start-companion-windows.cmd` because it is an unsigned script downloaded from the internet. That does not automatically mean the file is malicious, but users should only run files downloaded from the official TabToTube GitHub release.

Official release page:

```text
https://github.com/shubhssks/TabToTube/releases/latest
```

## Recommended Manual Start

Use this method if Windows Defender or SmartScreen blocks the `.cmd` file.

1. Extract `TabToTube-Companion-Node-Bundle-v1.0.zip`.
2. Open the extracted folder that contains the `companion-app` folder.
3. Click the folder address bar, type `cmd`, and press Enter.
4. Run:

```cmd
set "ALLOWED_ORIGINS=chrome-extension://mahejikknnpligimdeiljklllmielkaf"
cd companion-app
npm install --omit=dev
npm start
```

Keep the Command Prompt window open while streaming.

Do not run these commands from `store_submission\v1.0\copy`. That folder only contains release copy and documentation, not the companion app.

## Health Check

Open this in Chrome after starting the companion:

```text
http://127.0.0.1:43310/health
```

Expected result:

```json
{
  "ok": true,
  "ffmpeg": {
    "available": true
  }
}
```

If `ffmpeg.available` is `false`, install FFmpeg and make sure `ffmpeg.exe` is on `PATH`, or copy `ffmpeg.exe` to:

```text
companion-app\bin\ffmpeg.exe
```

## Optional Unblock

If the bundle came from the official GitHub release and the checksum matches, Windows can be told to trust that downloaded file:

1. Right-click the downloaded zip or extracted `.cmd` file.
2. Open Properties.
3. Check Unblock.
4. Click Apply.

Do not disable Windows Defender or SmartScreen globally.
