# TabToTube

TabToTube is a lightweight Chrome extension plus local companion app for sending captured browser media to YouTube Live through FFmpeg.

## MVP Architecture

```text
Chrome Extension -> Local WebSocket Companion -> FFmpeg -> YouTube RTMP
```

## Quick Start

Install root dependencies:

```bash
npm install
```

Install the Playwright browser runtime used by automation:

```bash
npm run playwright:install
```

1. Install companion dependencies:

   ```bash
   npm run companion:install
   ```

2. Put FFmpeg at `companion-app/bin/ffmpeg.exe`, or make `ffmpeg` available on `PATH`.

3. Start the local companion:

   ```bash
   npm run companion:start
   ```

4. Load `extension/` as an unpacked extension in Chrome.

5. Open the extension popup, paste a YouTube stream key, choose a source, and start streaming.

The companion binds to `127.0.0.1` by default and listens on `ws://127.0.0.1:43310/stream`.
`npm run companion:health` reports whether FFmpeg is available before you try to go live.
Stream keys are not saved unless `Remember stream key` is checked in the popup.

See [commands](docs/COMMANDS.md), [development](docs/DEVELOPMENT.md), and [publishing](docs/PUBLISHING.md) for the full workflow.
For GitHub-hosted downloads without a public website, see [GitHub distribution](docs/GITHUB_DISTRIBUTION.md).
For extension listing media, see [store assets](docs/STORE_ASSETS.md).
For Chrome Web Store listing text, see [store copy](docs/STORE_DESC_TXT.md).
For the final Chrome Web Store dashboard checklist, see [store submission packet](docs/CHROME_WEB_STORE_SUBMISSION.md).
For YouTube quick-start video upload details, see [YouTube video upload](docs/YOUTUBE_VIDEO_UPLOAD.md).

## User Install

Public users install the Chrome extension from the Chrome Web Store and download the companion app from:

```text
https://github.com/shubhssks/TabToTube/releases/latest
```

The extension popup also shows this companion download link directly, so users see the required local app before they try to stream.

## Extension Builds

Install root automation dependencies once:

```bash
npm install
```

Create both extension builds:

```bash
npm run build
```

Outputs:

- `dist_dev/`: unpacked development extension, named `TabToTube Dev`.
- `dist_prod/`: unpacked production extension, named `TabToTube`.
- `dist_prod/tabtotube-extension-v1.0.0.zip`: Chrome Web Store upload artifact.

## Automation

Run the complete build and test pipeline:

```bash
npm run test:all
```

This runs:

- `npm run build`
- JavaScript syntax checks
- automation coverage report
- Playwright suites for build, popup, and companion bridge

Run the Playwright suites as separate parallel processes:

```bash
npm run test:automation:parallel
```

Reports are written under `automation/reports/`.

## Publish Artifact

To create the Chrome Web Store zip:

```bash
npm run publish:zip
```

Upload `dist_prod/tabtotube-extension-v1.0.0.zip` after testing the unpacked `dist_prod/` extension.
