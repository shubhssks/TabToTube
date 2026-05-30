# Chrome Web Store Assets

Generated publishing assets live under:

```text
assets/publishing/
```

Extension icons used by the package live under:

```text
extension/icons/
```

Generate all assets:

```bash
npm run assets:publish
```

## Icons

Generated files:

```text
extension/icons/icon16.png
extension/icons/icon32.png
extension/icons/icon48.png
extension/icons/icon128.png
assets/publishing/tabtotube-icon-128.png
```

`extension/manifest.json` references these icons for the extension action and Chrome extension package.

## Screenshots

Generated Chrome Web Store screenshots:

```text
assets/publishing/screenshots/01-start-stream.png
assets/publishing/screenshots/02-source-selection.png
assets/publishing/screenshots/03-companion-ready.png
assets/publishing/screenshots/04-live-status.png
assets/publishing/screenshots/05-local-architecture.png
```

Each screenshot is `1280x800`.

## Promotional Images

Generated promotional images:

```text
assets/publishing/promotional/small-promo-440x280.png
assets/publishing/promotional/large-promo-920x680.png
assets/publishing/promotional/marquee-promo-1400x560.png
```

Chrome Web Store tiles:

```text
Small promo tile: assets/publishing/promotional/small-promo-440x280.png
Canvas: 440 x 280

Marquee promo tile: assets/publishing/promotional/marquee-promo-1400x560.png
Canvas: 1400 x 560
```

## Instructional Video

Generated video and poster:

```text
assets/publishing/video/tabtotube-quick-start.mp4
assets/publishing/video/tabtotube-quick-start-poster.png
```

The video is a short no-audio walkthrough for tester onboarding and release pages.

## Store Notes

Chrome Web Store image requirements can change. Before upload, compare these assets against the current official Chrome Web Store image guidance:

```text
https://developer.chrome.com/docs/webstore/images
```

GitHub release assets include the same media in:

```text
release_assets/TabToTube-Store-Assets-v1.0.zip
```
