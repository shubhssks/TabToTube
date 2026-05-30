import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const requestedSuites = process.argv.slice(2);
const suites = requestedSuites.length ? requestedSuites : ["build", "popup", "companion"];
const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "../..");
const playwrightCli = resolve(root, "node_modules/playwright/cli.js");

if (!existsSync(playwrightCli)) {
  console.error("Playwright CLI is not installed. Run npm install first.");
  process.exit(1);
}

const results = await Promise.all(suites.map((suite) => runSuite(suite)));
const failed = results.filter((result) => result.code !== 0);

if (failed.length) {
  for (const result of failed) {
    console.error(`Suite ${result.suite} failed with exit code ${result.code}`);
  }
  process.exit(1);
}

console.log(`Parallel suites passed: ${suites.join(", ")}`);

function runSuite(suite) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [playwrightCli, "test", `--project=${suite}`], {
      cwd: root,
      env: {
        ...process.env,
        PLAYWRIGHT_SUITE: suite
      },
      shell: false,
      stdio: "inherit"
    });

    child.on("exit", (code) => {
      resolvePromise({ suite, code: code ?? 1 });
    });
  });
}
