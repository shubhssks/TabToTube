# Chrome Web Store Copy

Use this file to copy/paste listing text into the Chrome Web Store Developer Dashboard.

## Extension Name

```text
TabToTube
```

## Short Description

```text
Capture a tab, window, or screen and stream it to YouTube Live through a local FFmpeg companion app.
```

## Detailed Description

```text
TabToTube helps creators stream a browser tab, window, or screen directly to YouTube Live with a lightweight local workflow.

Instead of routing your stream through an extra cloud relay, TabToTube captures media in Chrome and sends it to a local companion app. The companion app uses FFmpeg to publish the stream to YouTube Live over RTMP.

Key features:
- Capture the active browser tab
- Capture a screen, window, or desktop source
- Stream to YouTube Live RTMP
- Start and stop streaming from the extension popup
- Choose video bitrate
- View stream status and elapsed duration
- Check local companion and FFmpeg readiness
- Keep stream keys session-only by default
- Optionally remember a stream key on your own device

How it works:
1. Install the TabToTube extension.
2. Install and start the TabToTube Companion App.
3. Create a YouTube Live stream in YouTube Studio.
4. Paste your stream key into TabToTube.
5. Choose Tab or Screen.
6. Click Start.

Important:
TabToTube requires the separate TabToTube Companion App for streaming. The extension cannot run FFmpeg by itself because browser extensions are sandboxed. The extension popup shows the companion app download link. You can also download it from https://github.com/shubhssks/TabToTube/releases/latest

Privacy:
TabToTube is designed to run locally. Captured media is sent to the local companion app on your computer, then FFmpeg sends it directly to the YouTube RTMP endpoint using the stream key you provide. TabToTube does not operate a cloud relay server.

Current version:
This is an early MVP intended for private testing and creator workflow validation. Please test with a private or unlisted YouTube Live stream before relying on it for an important public broadcast.
```

## One-Line Tagline

```text
Stream browser tabs and screens to YouTube Live through a local FFmpeg bridge.
```

## Feature Bullets

```text
- Stream tabs or screens to YouTube Live
- Local companion app with FFmpeg RTMP publishing
- No third-party cloud relay
- Lightweight popup controls
- Stream status and duration timer
- Stream keys are not saved unless you choose to remember them
```

## Companion App Notice

```text
TabToTube requires the TabToTube Companion App to stream. The companion app runs locally and bridges captured browser media to FFmpeg for YouTube RTMP publishing.
```

## Privacy Practices Summary

```text
TabToTube captures the browser tab, window, or screen source selected by the user. Captured media is sent to a local companion app running on 127.0.0.1 and then streamed to YouTube Live using FFmpeg. TabToTube does not send captured media to TabToTube-owned servers.

The YouTube stream key is provided by the user. It is not stored by default. If the user enables "Remember stream key", the key is saved locally in Chrome extension storage on that device.
```

## Data Usage Disclosure

```text
Data used:
- User-provided YouTube stream key
- User-selected tab, window, or screen media during active streaming
- Local extension settings such as bitrate and companion URL

Data is used only to start, maintain, and stop the user-requested live stream.
```

## Permissions Explanation

```text
activeTab:
Used to identify and capture the active tab when the user chooses Tab capture.

tabCapture:
Used to capture browser tab media.

desktopCapture:
Used to let the user choose a screen, window, or desktop source.

offscreen:
Used to keep media capture and encoding running outside the popup.

storage:
Used to save local settings such as bitrate, companion URL, and optionally the stream key if the user enables Remember stream key.

notifications:
Reserved for stream status notifications.
```

## Reviewer Test Instructions

```text
TabToTube requires a local companion app for end-to-end streaming.

Test setup:
1. Install the extension.
2. Download the companion bundle from https://github.com/shubhssks/TabToTube/releases/latest
3. Extract the companion bundle.
4. Make sure Node.js 18+ is installed.
5. Make sure FFmpeg is available on PATH or copied to companion-app/bin/ffmpeg.exe.
6. Start the companion with start-companion-windows.cmd or npm run companion:start.
7. Open http://127.0.0.1:43310/health and confirm ok: true and ffmpeg.available: true.
8. Open the extension popup.
9. Paste a test YouTube Live stream key.
10. Choose Tab or Screen.
11. Click Start.
12. Confirm YouTube Studio receives the stream.
13. Click Stop and confirm streaming stops.

If no YouTube stream key is available, the popup UI, source selection, stream-key validation, companion missing state, and companion health endpoint can still be reviewed without going live.
```

## Support / Contact

```text
For issues, open a GitHub issue in the public TabToTube downloads repository or contact the developer through the Chrome Web Store support channel.
```

## Release Notes 1.0

```text
Initial MVP release.

Includes:
- Manifest V3 extension
- Popup controls for stream key, source, bitrate, start, stop, status, and duration
- Tab capture and screen/window capture
- Offscreen MediaRecorder processing
- Local WebSocket companion bridge
- FFmpeg health preflight
- YouTube RTMP output through FFmpeg
- GitHub release distribution assets
- Chrome Web Store icons, screenshots, promo images, and instructional video
```

## Category Suggestion

```text
Productivity
```

Alternative:

```text
Workflow & Planning
```

