# GitHub Download Distribution

Use this when the source repository stays private and there is no public website yet.

## Recommended Layout

```text
Private repo:  TabToTube
Public repo:   tabtotube-releases
```

The public repo should contain only release assets, not source code.

Public user download URL:

```text
https://github.com/<your-github-owner>/tabtotube-releases/releases/latest
```

## One-Time GitHub Setup

1. Create a new public GitHub repository named `tabtotube-releases`.
2. In the private source repository, open Settings -> Secrets and variables -> Actions.
3. Add repository variable:

```text
RELEASES_REPO=<your-github-owner>/tabtotube-releases
```

4. Add repository secret:

```text
RELEASES_REPO_TOKEN=<fine-grained GitHub token>
```

The token needs `Contents: Read and write` permission for the public `tabtotube-releases` repo.

## Publish From GitHub Actions

After the setup above:

1. Open the private source repo on GitHub.
2. Go to Actions.
3. Select `Publish Download Release`.
4. Click Run workflow.
5. Enter the version, for example `0.1.0`.

The workflow publishes a release to the public downloads repo with:

- `TabToTube-Extension-v0.1.0.zip`
- `TabToTube-Companion-Node-Bundle-v0.1.0.zip`
- `checksums-sha256.txt`

## Manual Publish

If GitHub Actions is not configured yet, build assets locally:

```bash
npm run release:assets
```

Then manually create a release in the public `tabtotube-releases` repo and upload everything from:

```text
release_assets/
```

## Current Companion Asset

`TabToTube-Companion-Node-Bundle-v0.1.0.zip` is a temporary tester bundle. It requires:

- Node.js 18+
- FFmpeg on PATH or `companion-app/bin/ffmpeg.exe`

Before public launch, replace this bundle with a signed Windows installer.

## Extension Download Link

The extension should point users to:

```text
https://github.com/<your-github-owner>/tabtotube-releases/releases/latest
```

Once your GitHub owner is final, update the companion download URL in the extension UI before publishing.

