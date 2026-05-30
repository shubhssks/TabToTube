# Publishing Workflow

## Build Production Artifacts

Run:

```bash
npm run publish:zip
```

This creates:

- `dist_prod/`
- `dist_prod/tabtotube-extension-v1.0.0.zip`

For GitHub download releases, run:

```bash
npm run release:assets
```

This creates upload-ready files under `release_assets/`.

## Pre-Publish Verification

Run:

```bash
npm run test:all
```

Generate store listing media:

```bash
npm run assets:publish
```

Expected checks:

- `dist_dev/` and `dist_prod/` are generated.
- Production zip exists.
- Manifest references point to real files.
- Secret-like token checks pass.
- Popup automation passes.
- Companion bridge automation passes.
- Automation coverage is 100%.

## Manual Chrome Validation

Before publishing:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Load unpacked `D:\Workplace\TabToTube\dist_prod`.
4. Start the companion with `npm run companion:start`.
5. Confirm `npm run companion:health` reports `ok: true` and `ffmpeg.available: true`.
6. Start a private or unlisted YouTube Live stream.
7. Confirm Start, Stop, status, duration, and stream-key remember behavior work.

## Chrome Web Store Upload

Upload:

```text
dist_prod/tabtotube-extension-v1.0.0.zip
```

Do not upload `dist_dev/`.

Use [Chrome Web Store Submission Packet](CHROME_WEB_STORE_SUBMISSION.md) for exact dashboard fields, image paths, privacy answers, and reviewer instructions.

## GitHub Downloads

The current public companion download is:

```text
https://github.com/shubhssks/TabToTube/releases/latest
```

If the source repo becomes private again and there is no website, publish public binaries through a separate public GitHub repo.

See [GitHub Download Distribution](GITHUB_DISTRIBUTION.md).

## Store Listing Assets

See [Chrome Web Store Assets](STORE_ASSETS.md).

## YouTube Upload Details

Use [YouTube Video Upload Details](YOUTUBE_VIDEO_UPLOAD.md) for the quick-start video title, description, tags, thumbnail path, and recommended visibility settings.

## Store Listing Copy

Copy/paste listing text from [Chrome Web Store Copy](STORE_DESC_TXT.md).

## Production Notes

- Do not hardcode stream keys.
- Do not enable `Remember stream key` on shared machines.
- Keep the companion bound to `127.0.0.1` unless there is a reviewed reason to expose it.
- Set `ALLOWED_ORIGINS` to the exact published Chrome extension origin once the extension ID is known.
- Bundle or document FFmpeg installation before distributing to non-developer users.
