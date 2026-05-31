# Non-Technical User Install Plan

The current companion ZIP is acceptable for testers, but it is not the final non-technical user experience. Windows may block `start-companion-windows.cmd` because it is an unsigned downloaded script.

## Easiest Current Tester Flow

Use this only for trusted testers downloading from the official GitHub release:

1. Download `TabToTube-Companion-Node-Bundle-v1.0.zip` from:

   ```text
   https://github.com/shubhssks/TabToTube/releases/latest
   ```

2. Right-click the downloaded ZIP.
3. Open Properties.
4. Check Unblock.
5. Click Apply.
6. Extract the ZIP.
7. Double-click `start-companion-windows.cmd`.

If Windows still shows Microsoft Defender SmartScreen, the tester can click More info -> Run anyway, but only if the file came from the official release and the checksum matches.

Do not tell users to disable Windows Defender or SmartScreen globally.

## Recommended Production Flow

For real non-technical users, ship a signed Windows installer:

```text
Install TabToTube Companion -> Start Menu shortcut -> local companion runs -> extension detects it
```

The installer should:

- Bundle the companion app as a normal Windows app.
- Bundle or install FFmpeg.
- Bundle a Node runtime or compile the companion into an executable.
- Create a Start Menu shortcut named `TabToTube Companion`.
- Start the companion app without requiring Command Prompt.
- Keep the companion bound to `127.0.0.1`.
- Set the allowed extension origin to `chrome-extension://mahejikknnpligimdeiljklllmielkaf`.
- Optionally register native messaging later.
- Be code-signed before public release.

## Why Code Signing Matters

Unsigned `.cmd`, `.ps1`, `.exe`, and installer files downloaded from the internet can trigger Windows SmartScreen, especially for new apps with no reputation.

A signed installer does not guarantee there will never be warnings, but it is the correct path for a public consumer release. Over time, a signed installer builds reputation and creates a much smoother install experience.

## Practical Next Milestone

Build this next:

1. Package companion as `TabToTube Companion.exe`.
2. Include FFmpeg in the installer.
3. Create an Inno Setup installer.
4. Add Start Menu shortcut.
5. Add uninstall entry.
6. Sign the installer.
7. Replace the current companion ZIP on GitHub releases with the installer.
