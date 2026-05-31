# Installer

The Windows installer is the required path for non-technical users. The current companion ZIP is a tester bundle and may be blocked by Windows SmartScreen because it contains an unsigned downloaded `.cmd` file.

The installer should package:

- Companion app files.
- FFmpeg binary.
- A Node runtime or compiled companion executable.
- Start Menu shortcut.
- Uninstall entry.
- Native messaging host manifest.
- Registry entry under `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.tabtotube.host`.

Inno Setup is the recommended first packaging target.

Before public distribution, sign the installer. Without signing, Windows may still show SmartScreen warnings.

See:

- `docs/NON_TECHNICAL_USER_INSTALL.md`
- `docs/COMPANION_WINDOWS_START.md`
