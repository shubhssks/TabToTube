import { createWriteStream } from "node:fs";
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");
const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const sourceDir = resolve(root, "extension");
const targets = {
  dev: resolve(root, "dist_dev"),
  prod: resolve(root, "dist_prod")
};

const targetName = process.argv[2];
if (!["dev", "prod", "all"].includes(targetName)) {
  console.error("Usage: node scripts/build-extension.mjs <dev|prod|all>");
  process.exit(1);
}

if (targetName === "all") {
  await build("dev");
  await build("prod");
} else {
  await build(targetName);
}

async function build(target) {
  const outputDir = targets[target];
  await rm(outputDir, { force: true, recursive: true });
  await mkdir(outputDir, { recursive: true });
  await copyDirectory(sourceDir, outputDir);
  await writeBuildManifest(outputDir, target);
  await validateBuild(outputDir);

  if (target === "prod") {
    await createArchive(outputDir);
  }

  console.log(`Built ${target} extension at ${relative(root, outputDir)}`);
}

async function copyDirectory(from, to) {
  await mkdir(to, { recursive: true });
  const entries = await readdir(from, { withFileTypes: true });

  for (const entry of entries) {
    const source = join(from, entry.name);
    const destination = join(to, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(source, destination);
      continue;
    }

    await copyFile(source, destination);
  }
}

async function writeBuildManifest(outputDir, target) {
  const manifestPath = join(outputDir, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  if (target === "dev") {
    manifest.name = "TabToTube Dev";
    manifest.version_name = `${manifest.version}-dev`;
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function validateBuild(outputDir) {
  const manifestPath = join(outputDir, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  const requiredFiles = [
    manifest.action?.default_popup,
    manifest.background?.service_worker,
    "offscreen/offscreen.html",
    "offscreen/offscreen.js",
    "config.js",
    "streaming/encoder.js",
    "capture/tabCapture.js",
    "capture/screenCapture.js"
  ].filter(Boolean);

  for (const requiredFile of requiredFiles) {
    const absolutePath = join(outputDir, requiredFile);
    await stat(absolutePath);
  }

  const files = await listFiles(outputDir);
  const forbiddenPatterns = [/STREAM_KEY/i, /AIza[0-9A-Za-z_-]{35}/, /ya29\.[0-9A-Za-z_-]+/];

  for (const file of files) {
    if ([".html", ".js", ".json", ".css"].includes(extname(file))) {
      const content = await readFile(file, "utf8");
      const match = forbiddenPatterns.find((pattern) => pattern.test(content));
      if (match) {
        throw new Error(`Forbidden secret-like pattern ${match} found in ${relative(root, file)}`);
      }
    }
  }
}

async function createArchive(outputDir) {
  const manifest = JSON.parse(await readFile(join(outputDir, "manifest.json"), "utf8"));
  const zipPath = join(outputDir, `tabtotube-extension-v${manifest.version}.zip`);
  const files = await listFiles(outputDir);

  await new Promise((resolvePromise, rejectPromise) => {
    const output = createWriteStream(zipPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on("close", resolvePromise);
    archive.on("error", rejectPromise);
    archive.pipe(output);

    for (const file of files) {
      if (file === zipPath) {
        continue;
      }

      archive.file(file, {
        name: normalize(relative(outputDir, file))
      });
    }

    archive.finalize();
  });
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(absolutePath));
      continue;
    }
    files.push(absolutePath);
  }

  return files;
}

function normalize(value) {
  return value.replaceAll("\\", "/");
}
