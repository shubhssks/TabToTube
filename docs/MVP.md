# TabToTube MVP

## Implemented Scope

- Manifest V3 Chrome extension shell.
- Popup controls for stream key, capture source, bitrate, companion URL, start, stop, status, and duration.
- Explicit stream-key persistence opt-in through `Remember stream key`.
- Background service worker for status, capture permission flow, and offscreen coordination.
- Offscreen document for long-running capture and MediaRecorder encoding.
- Tab capture through `chrome.tabCapture`.
- Screen/window capture through `chrome.desktopCapture`.
- WebM chunk streaming to a local WebSocket bridge.
- Node companion app that pipes chunks to FFmpeg stdin and publishes to YouTube RTMP.
- Companion health endpoint with FFmpeg availability and version/error reporting.

## Companion App

Default endpoint:

```text
ws://127.0.0.1:43310/stream
```

Health endpoint:

```text
http://127.0.0.1:43310/health
```

The health response includes:

```json
{
  "ok": true,
  "activeSessions": 0,
  "ffmpeg": {
    "available": true,
    "path": "ffmpeg",
    "version": "ffmpeg version ..."
  }
}
```

By default, the WebSocket server only accepts browser origins that start with `chrome-extension://`. For tighter production builds, set the exact unpacked or published extension origin:

```bash
ALLOWED_ORIGINS=chrome-extension://EXTENSION_ID npm start
```

FFmpeg discovery order:

1. `FFMPEG_PATH` environment variable.
2. `companion-app/bin/ffmpeg.exe` on Windows, or `companion-app/bin/ffmpeg` on other platforms.
3. `ffmpeg` on `PATH`.

## YouTube RTMP

Default RTMP base URL:

```text
rtmp://a.rtmp.youtube.com/live2
```

Override with:

```bash
RTMP_BASE_URL=rtmp://example.com/live npm start
```

## Current Limitations

- Native messaging registration is not implemented yet; the MVP uses a localhost WebSocket bridge.
- Installer packaging is not implemented yet.
- Automatic reconnect is not implemented yet.
- Webcam overlay, audio mixing controls, and local recording are future features.

## Build And Test Pipeline

The workspace now has root-level scripts for extension publishing and automation:

```bash
npm run build
npm run test:all
npm run verify
```

`npm run build` creates `dist_dev/`, `dist_prod/`, and `dist_prod/tabtotube-extension-v0.1.0.zip`.

`npm run test:all` builds both outputs, checks JavaScript syntax, writes the automation coverage report, and runs Playwright build, popup, and companion suites in parallel.
The current coverage matrix tracks build output, popup validation, explicit stream-key persistence, companion origin policy, and FFmpeg health reporting.

Full command documentation:

- [Command Reference](COMMANDS.md)
- [Development Workflow](DEVELOPMENT.md)
- [Publishing Workflow](PUBLISHING.md)
