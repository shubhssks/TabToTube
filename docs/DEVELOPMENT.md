# Development Workflow

## Local Prerequisites

- Node.js 18 or newer.
- Chrome or Chromium for loading the unpacked extension.
- FFmpeg on `PATH`, or a binary at `companion-app/bin/ffmpeg.exe` on Windows.
- A YouTube Live stream key for real RTMP streaming tests.

## First-Time Setup

```bash
npm install
npm run companion:install
npm run playwright:install
```

## Local Run Loop

Start the companion bridge:

```bash
npm run companion:start
```

Load the extension in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select `D:\Workplace\TabToTube\extension` for source development, or `D:\Workplace\TabToTube\dist_dev` for build validation.

Open the extension popup, enter the YouTube stream key, choose Tab or Screen, and click Start.

## Environment Variables

Companion app:

```bash
HOST=127.0.0.1
PORT=43310
RTMP_BASE_URL=rtmp://a.rtmp.youtube.com/live2
FFMPEG_PATH=C:\path\to\ffmpeg.exe
ALLOWED_ORIGINS=chrome-extension://EXTENSION_ID
```

On Windows PowerShell, set environment variables before starting the companion:

```powershell
$env:FFMPEG_PATH="C:\path\to\ffmpeg.exe"
$env:ALLOWED_ORIGINS="chrome-extension://EXTENSION_ID"
npm run companion:start
```

## Testing During Development

Fast checks:

```bash
npm run check:js
npm run test:automation:popup
```

Companion bridge checks:

```bash
npm run test:automation:companion
```

Full confidence check:

```bash
npm run test:all
```

## Automation Coverage

The coverage matrix lives at `automation/coverage-matrix.json`.

Generate the report:

```bash
npm run test:coverage
```

Report outputs:

- `automation/reports/coverage/coverage.json`
- `automation/reports/coverage/coverage.md`

