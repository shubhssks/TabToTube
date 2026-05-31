import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");
const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const releaseDir = resolve(root, "release_assets");
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const manifest = JSON.parse(await readFile(resolve(root, "extension", "manifest.json"), "utf8"));
const packageVersion = manifest.version || packageJson.version;
const version = process.env.RELEASE_VERSION || manifest.version_name || packageVersion;
const chromeWebStoreUrl = "https://chromewebstore.google.com/detail/mahejikknnpligimdeiljklllmielkaf";
const publishedExtensionOrigin = "chrome-extension://mahejikknnpligimdeiljklllmielkaf";

await rm(releaseDir, { force: true, recursive: true });
await mkdir(releaseDir, { recursive: true });

const extensionZipName = `TabToTube-Extension-v${version}.zip`;
const companionZipName = `TabToTube-Companion-Node-Bundle-v${version}.zip`;
const storeAssetsZipName = `TabToTube-Store-Assets-v${version}.zip`;
const sourceExtensionZip = resolve(root, "dist_prod", `tabtotube-extension-v${packageVersion}.zip`);
const targetExtensionZip = resolve(releaseDir, extensionZipName);
const targetCompanionZip = resolve(releaseDir, companionZipName);
const targetStoreAssetsZip = resolve(releaseDir, storeAssetsZipName);

await stat(sourceExtensionZip);
await copyFile(sourceExtensionZip, targetExtensionZip);
await createCompanionBundle(targetCompanionZip);
await createStoreAssetsBundle(targetStoreAssetsZip);

const checksumPath = resolve(releaseDir, "checksums-sha256.txt");
const releaseNotesPath = resolve(releaseDir, "RELEASE_NOTES.md");
const assetFiles = [
  targetExtensionZip,
  targetCompanionZip,
  targetStoreAssetsZip
];

await writeFile(checksumPath, await renderChecksums(assetFiles));
await writeFile(releaseNotesPath, renderReleaseNotes({
  companionZipName,
  extensionZipName,
  storeAssetsZipName,
  version
}));

console.log(`Release assets written to ${relative(root, releaseDir)}`);

async function createCompanionBundle(zipPath) {
  const files = await listFiles(resolve(root, "companion-app"), shouldIncludeCompanionFile);

  await new Promise((resolvePromise, rejectPromise) => {
    const output = createWriteStream(zipPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on("close", resolvePromise);
    archive.on("error", rejectPromise);
    archive.pipe(output);

    for (const file of files) {
      archive.file(file, {
        name: normalize(relative(root, file))
      });
    }

    archive.append(renderStartScript(), {
      name: "start-companion-windows.cmd"
    });
    archive.append(renderCompanionReadme(), {
      name: "README-COMPANION.txt"
    });
    archive.append(renderWindowsStartGuide(), {
      name: "START-HERE-WINDOWS.txt"
    });

    archive.finalize();
  });
}

async function createStoreAssetsBundle(zipPath) {
  const files = [
    ...await listFiles(resolve(root, "assets", "publishing"), () => true),
    ...await listFiles(resolve(root, "extension", "icons"), () => true)
  ];

  await new Promise((resolvePromise, rejectPromise) => {
    const output = createWriteStream(zipPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on("close", resolvePromise);
    archive.on("error", rejectPromise);
    archive.pipe(output);

    for (const file of files) {
      archive.file(file, {
        name: normalize(relative(root, file))
      });
    }

    archive.finalize();
  });
}

async function renderChecksums(files) {
  const lines = [];

  for (const file of files) {
    lines.push(`${await sha256(file)}  ${relative(releaseDir, file)}`);
  }

  lines.push("");
  return lines.join("\n");
}

function renderReleaseNotes({ companionZipName, extensionZipName, storeAssetsZipName, version: releaseVersion }) {
  return [
    `# TabToTube v${releaseVersion}`,
    "",
    "## Downloads",
    "",
    `- \`${extensionZipName}\`: extension package for Chrome Web Store upload or manual developer testing.`,
    `- \`${companionZipName}\`: temporary companion app bundle for testers. It requires Node.js 18+ and FFmpeg on PATH or in \`companion-app/bin/ffmpeg.exe\`.`,
    `- \`${storeAssetsZipName}\`: Chrome Web Store icons, screenshots, promotional images, and instructional video.`,
    "- `checksums-sha256.txt`: SHA-256 checksums for release assets.",
    "",
    "## Tester Setup",
    "",
    "1. Download the companion bundle from https://github.com/shubhssks/TabToTube/releases/latest.",
    "2. Extract the companion bundle.",
    "3. Open `START-HERE-WINDOWS.txt` and follow the manual terminal commands.",
    "4. If Windows allows it, `start-companion-windows.cmd` can be used as a shortcut.",
    "5. Confirm `http://127.0.0.1:43310/health` reports `ffmpeg.available: true`.",
    "6. Install or load the extension.",
    "7. Paste a YouTube Live stream key and start a private test stream.",
    "",
    "## Chrome Web Store",
    "",
    chromeWebStoreUrl,
    "",
    "## Production Note",
    "",
    "The companion bundle is not a final end-user installer. Replace it with a signed Windows installer before public launch.",
    ""
  ].join("\n");
}

function renderStartScript() {
  return [
    "@echo off",
    "setlocal",
    `set "ALLOWED_ORIGINS=${publishedExtensionOrigin}"`,
    "cd /d \"%~dp0companion-app\"",
    "if not exist node_modules (",
    "  npm install --omit=dev",
    ")",
    "npm start",
    ""
  ].join("\r\n");
}

function renderCompanionReadme() {
  return [
    "TabToTube Companion Bundle",
    "",
    "This is a temporary tester bundle, not the final production installer.",
    "",
    "Requirements:",
    "- Node.js 18 or newer",
    "- FFmpeg on PATH, or ffmpeg.exe copied to companion-app\\bin\\ffmpeg.exe",
    `- Published extension origin allowed by default: ${publishedExtensionOrigin}`,
    "",
    "Start on Windows:",
    "1. Extract this zip.",
    "2. Open START-HERE-WINDOWS.txt.",
    "3. Use the manual terminal commands listed there.",
    "4. If Windows allows it, start-companion-windows.cmd can be used as a shortcut.",
    "5. Visit http://127.0.0.1:43310/health and check ffmpeg.available.",
    "",
    "If Windows blocks start-companion-windows.cmd as unsafe:",
    "- Do not disable Windows security globally.",
    "- Use START-HERE-WINDOWS.txt and run the commands manually in Command Prompt.",
    "- Only use Run anyway or Unblock if the zip came from the official GitHub release and checksums match.",
    "",
    "For production, distribute a signed installer instead of this bundle.",
    ""
  ].join("\r\n");
}

function renderWindowsStartGuide() {
  return [
    "TabToTube Companion - Windows Start Guide",
    "",
    "Windows may block start-companion-windows.cmd because it is an unsigned script downloaded from the internet.",
    "That does not automatically mean the file is malicious, but you should only run files downloaded from the official TabToTube GitHub release.",
    "",
    "Official release page:",
    "https://github.com/shubhssks/TabToTube/releases/latest",
    "",
    "Recommended manual start method:",
    "",
    "1. Extract the companion zip.",
    "2. Open the extracted folder that contains the companion-app folder.",
    "3. Click the folder address bar, type cmd, and press Enter.",
    "4. Run these commands:",
    "",
    `set "ALLOWED_ORIGINS=${publishedExtensionOrigin}"`,
    "cd companion-app",
    "npm install --omit=dev",
    "npm start",
    "",
    "5. Keep the Command Prompt window open while streaming.",
    "6. Open this health check in Chrome:",
    "",
    "http://127.0.0.1:43310/health",
    "",
    "Expected health check should contain:",
    "",
    "\"ok\": true",
    "\"available\": true",
    "",
    "Do not run these commands from store_submission\\v1.0\\copy. That folder only contains release copy and documentation, not the companion app.",
    "",
    "If ffmpeg.available is false:",
    "",
    "- Install FFmpeg and make sure ffmpeg.exe is on PATH, or",
    "- Copy ffmpeg.exe to companion-app\\bin\\ffmpeg.exe",
    "",
    "Optional unblock method:",
    "",
    "If you trust the official GitHub release and the checksum matches, you can right-click the downloaded zip or extracted .cmd file, open Properties, check Unblock, and click Apply.",
    "",
    "Do not disable Windows Defender or SmartScreen globally.",
    ""
  ].join("\r\n");
}

async function sha256(file) {
  return new Promise((resolvePromise, rejectPromise) => {
    const hash = createHash("sha256");
    const stream = createReadStream(file);
    stream.on("error", rejectPromise);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolvePromise(hash.digest("hex")));
  });
}

async function listFiles(directory, include) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    const relativePath = normalize(relative(root, absolutePath));

    if (entry.isDirectory()) {
      if (include(relativePath, true)) {
        files.push(...await listFiles(absolutePath, include));
      }
      continue;
    }

    if (include(relativePath, false)) {
      files.push(absolutePath);
    }
  }

  return files;
}

function shouldIncludeCompanionFile(relativePath, isDirectory) {
  const normalized = normalize(relativePath);
  if (normalized.includes("/node_modules") || normalized.includes("/.cache")) {
    return false;
  }

  if (isDirectory) {
    return true;
  }

  return [".js", ".json", ".md", ".txt", ".cmd", ".exe"].includes(extname(normalized))
    || normalized.endsWith(".gitkeep");
}

function normalize(value) {
  return value.replaceAll("\\", "/");
}
