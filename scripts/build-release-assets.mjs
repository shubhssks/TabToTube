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
    "1. Download and extract the companion bundle.",
    "2. Run `start-companion-windows.cmd`.",
    "3. Confirm `http://127.0.0.1:43310/health` reports `ffmpeg.available: true`.",
    "4. Install or load the extension.",
    "5. Paste a YouTube Live stream key and start a private test stream.",
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
    "",
    "Start on Windows:",
    "1. Extract this zip.",
    "2. Double-click start-companion-windows.cmd.",
    "3. Visit http://127.0.0.1:43310/health and check ffmpeg.available.",
    "",
    "For production, distribute a signed installer instead of this bundle.",
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
