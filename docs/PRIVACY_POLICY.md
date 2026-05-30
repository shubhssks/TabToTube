# TabToTube Privacy Policy

Effective date: 2026-05-30

TabToTube is a Chrome extension and local companion app for streaming a user-selected browser tab, window, or screen to YouTube Live through FFmpeg.

## Data Processed

TabToTube processes only the data needed to start, maintain, and stop the stream requested by the user:

- User-selected tab, window, or screen media during active streaming.
- The YouTube stream key entered by the user.
- Local extension settings such as bitrate, companion URL, source choice, and the "Remember stream key" preference.

## How Data Is Used

Captured media is sent from the Chrome extension to the TabToTube Companion App running locally on the user's computer, normally at `127.0.0.1`. The companion app passes the media to FFmpeg, which sends the stream to the YouTube Live RTMP endpoint using the stream key provided by the user.

TabToTube does not operate a cloud relay server and does not send captured media, stream keys, or local settings to TabToTube-owned servers.

## Stream Key Storage

The stream key is not saved by default. If the user enables "Remember stream key", the key is stored locally in Chrome extension storage on that device. The user can clear it by disabling the option or clearing extension data.

## Data Sharing

TabToTube does not sell user data. TabToTube does not share user data with advertisers, analytics providers, or data brokers.

The user-requested live stream is sent to YouTube Live because that is the core function of the product. YouTube's handling of received stream content is governed by Google's applicable terms and policies.

## Permissions

TabToTube uses Chrome extension permissions only for its streaming purpose:

- `activeTab`: identify and capture the active tab after user action.
- `tabCapture`: capture browser tab media.
- `desktopCapture`: let the user choose a screen, window, or desktop source.
- `offscreen`: keep media capture and encoding running outside the popup.
- `storage`: save local settings and, only if the user chooses, the stream key.

## Remote Code

TabToTube does not execute remotely hosted code in the extension.

## Limited Use

TabToTube's use of information received from Chrome APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.

## Contact

For questions or issues, open an issue at:

```text
https://github.com/shubhssks/TabToTube/issues
```
