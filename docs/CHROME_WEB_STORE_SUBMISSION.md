# Chrome Web Store Submission Packet

Use this file while filling the Chrome Web Store Developer Dashboard for TabToTube 1.0.

## Upload Package

Upload this ZIP:

```text
dist_prod/tabtotube-extension-v1.0.0.zip
```

Expected package details:

```text
Name: TabToTube
Version: 1.0.0
Version name: 1.0
Manifest: MV3
Minimum Chrome version: 116
Chrome Web Store ID: mahejikknnpligimdeiljklllmielkaf
Chrome Web Store URL: https://chromewebstore.google.com/detail/mahejikknnpligimdeiljklllmielkaf
```

## Store Listing

Copy the listing text from:

```text
docs/STORE_DESC_TXT.md
```

Recommended dashboard values:

```text
Extension name: TabToTube
Category: Productivity
Language: English
Homepage URL: https://github.com/shubhssks/TabToTube
Support URL: https://github.com/shubhssks/TabToTube/issues
Companion download URL: https://github.com/shubhssks/TabToTube/releases/latest
Chrome Web Store URL: https://chromewebstore.google.com/detail/mahejikknnpligimdeiljklllmielkaf
```

## Images

Upload these assets:

```text
Icon:
assets/publishing/tabtotube-icon-128.png

Screenshots:
assets/publishing/screenshots/01-start-stream.png
assets/publishing/screenshots/02-source-selection.png
assets/publishing/screenshots/03-companion-ready.png
assets/publishing/screenshots/04-live-status.png
assets/publishing/screenshots/05-local-architecture.png

Small promo tile:
assets/publishing/promotional/small-promo-440x280.png

Marquee promo tile:
assets/publishing/promotional/marquee-promo-1400x560.png

Instructional video URL:
https://www.youtube.com/watch?v=R9HcFLHCXOE
```

The generated large promo tile is kept for compatibility with older/legacy dashboard fields. Upload it only if the dashboard shows a matching slot:

```text
assets/publishing/promotional/large-promo-920x680.png
```

## Privacy Tab

Single purpose:

```text
Capture a user-selected browser tab, window, or screen and stream it to YouTube Live through a local companion app and FFmpeg.
```

Remote code:

```text
No, TabToTube does not execute remotely hosted code in the extension.
```

Privacy policy URL:

```text
https://github.com/shubhssks/TabToTube/blob/master/docs/PRIVACY_POLICY.md
```

Data disclosure:

```text
TabToTube processes user-selected tab, window, or screen media during active streaming, the YouTube stream key entered by the user, and local extension settings such as bitrate and companion URL. Captured media is sent to the local companion app on 127.0.0.1 and then to YouTube Live RTMP at the user's request. TabToTube does not operate a cloud relay server, sell user data, or use data for advertising.
```

Suggested data categories to disclose conservatively:

```text
Website content: captured tab/window/screen media selected by the user during active streaming.
Authentication information: the user-provided YouTube stream key.
User activity: only if the dashboard classifies user-selected capture/streaming actions under this category.
```

## Permission Justifications

```text
activeTab:
Used to identify and capture the active tab only after the user chooses Tab capture.

tabCapture:
Used to capture browser tab audio/video when the user chooses Tab capture.

desktopCapture:
Used to let the user choose a screen, window, or desktop source.

offscreen:
Used to keep capture and MediaRecorder processing running outside the popup.

storage:
Used to save local settings such as bitrate and companion URL. The stream key is saved only if the user enables Remember stream key.
```

## Distribution

Recommended first submission:

```text
Visibility: Public
Regions: All regions unless you need to restrict availability
Pricing: Free
```

Use deferred publishing if you want to review the approved item before it becomes public.

## Reviewer Test Instructions

Paste the reviewer instructions from `docs/STORE_DESC_TXT.md`.

Important reviewer link:

```text
https://github.com/shubhssks/TabToTube/releases/latest
```

## Final Local Checks

Run before upload:

```bash
npm run release:verify
```

Confirm:

```text
dist_prod/tabtotube-extension-v1.0.0.zip exists
release_assets/TabToTube-Extension-v1.0.zip exists
release_assets/TabToTube-Companion-Node-Bundle-v1.0.zip exists
release_assets/TabToTube-Store-Assets-v1.0.zip exists
```
