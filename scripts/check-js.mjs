import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const ignoredDirs = new Set([
  ".git",
  ".sixth",
  "automation/reports",
  "dist",
  "dist_dev",
  "dist_prod",
  "node_modules",
  "playwright-report",
  "test-results"
]);

const files = [];
await collectJsFiles(root);

let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    failed = true;
    console.error(result.stderr || result.stdout);
  }
}

if (failed) {
  process.exit(1);
}

console.log(`Checked ${files.length} JavaScript files.`);

async function collectJsFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    const relativePath = normalize(relative(root, absolutePath));

    if (entry.isDirectory()) {
      if (!ignoredDirs.has(relativePath) && !ignoredDirs.has(entry.name)) {
        await collectJsFiles(absolutePath);
      }
      continue;
    }

    if ([".js", ".mjs", ".cjs"].includes(extname(entry.name))) {
      files.push(absolutePath);
    }
  }
}

function normalize(value) {
  return value.replaceAll("\\", "/");
}
