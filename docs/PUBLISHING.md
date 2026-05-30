# Publishing Workflow

## Build Production Artifacts

Run:

```bash
npm run publish:zip
```

This creates:

- `dist_prod/`
- `dist_prod/tabtotube-extension-v0.1.0.zip`

## Pre-Publish Verification

Run:

```bash
npm run test:all
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
5. Confirm `npm run companion:health` reports `ok: true`.
6. Start a private or unlisted YouTube Live stream.
7. Confirm Start, Stop, status, and duration work.

## Chrome Web Store Upload

Upload:

```text
dist_prod/tabtotube-extension-v0.1.0.zip
```

Do not upload `dist_dev/`.

## Production Notes

- Do not hardcode stream keys.
- Keep the companion bound to `127.0.0.1` unless there is a reviewed reason to expose it.
- Set `ALLOWED_ORIGINS` to the exact published Chrome extension origin once the extension ID is known.
- Bundle or document FFmpeg installation before distributing to non-developer users.

