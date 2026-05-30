# GitHub Download Distribution

Use this when there is no public website yet. The source repository is currently public, so releases can live in the same GitHub repository as the code.

## Current Layout

```text
Public repo: shubhssks/TabToTube
```

Public user download URL:

```text
https://github.com/shubhssks/TabToTube/releases/latest
```

## One-Time GitHub Setup

1. Keep `shubhssks/TabToTube` public.
2. In the repository, open Settings -> Secrets and variables -> Actions.
3. No repository variables are needed when publishing releases to `shubhssks/TabToTube`.
4. Add this optional repository variable only if you want the workflow to publish to a separate download repo later:

```text
RELEASES_REPO=<owner>/<download-repo>
```

5. Add this optional repository secret only when publishing to a separate download repo:

```text
RELEASES_REPO_TOKEN=<fine-grained GitHub token>
```

The token needs `Contents: Read and write` permission for the separate public downloads repo.

For same-repository manual releases, this token setup is not required.

## Publish From GitHub Actions

After the setup above:

1. Open `shubhssks/TabToTube` on GitHub.
2. Go to Actions.
3. Select `Publish Download Release`.
4. Click Run workflow.
5. Enter the version, for example `1.0`.

The workflow publishes a release to `shubhssks/TabToTube` by default with:

- `TabToTube-Extension-v1.0.zip`
- `TabToTube-Companion-Node-Bundle-v1.0.zip`
- `TabToTube-Store-Assets-v1.0.zip`
- `checksums-sha256.txt`

## Manual Publish

If GitHub Actions is not configured yet, build assets locally:

```bash
npm run release:assets
```

Then manually create a release in `shubhssks/TabToTube` and upload everything from:

```text
release_assets/
```

## Current Companion Asset

`TabToTube-Companion-Node-Bundle-v1.0.zip` is a temporary tester bundle. It requires:

- Node.js 18+
- FFmpeg on PATH or `companion-app/bin/ffmpeg.exe`

Before public launch, replace this bundle with a signed Windows installer.

## Extension Download Link

The extension should point users to:

```text
https://github.com/shubhssks/TabToTube/releases/latest
```

This URL is set in `extension/config.js` and shown directly in the extension popup.
