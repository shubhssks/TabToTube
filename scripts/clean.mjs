import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const targets = [
  "automation/reports",
  "dist_dev",
  "dist_prod",
  "playwright-report",
  "test-results"
];

await Promise.all(targets.map((target) => rm(resolve(root, target), {
  force: true,
  recursive: true
})));

console.log("Cleaned generated build and test artifacts.");
