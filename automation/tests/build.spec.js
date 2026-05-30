const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { test, expect } = require("@playwright/test");

const root = path.resolve(__dirname, "../..");

test.describe("extension builds", () => {
  test.describe.configure({ mode: "serial" });

  test("creates dist_dev with a development manifest", async () => {
    execFileSync(process.execPath, ["scripts/build-extension.mjs", "dev"], {
      cwd: root,
      stdio: "pipe"
    });

    const manifest = readJson(path.join(root, "dist_dev/manifest.json"));
    expect(manifest.name).toBe("TabToTube Dev");
    expect(manifest.version_name).toBe(`${manifest.version}-dev`);
    expect(manifest.version).toBe("1.0.0");
    expect(fs.existsSync(path.join(root, "dist_dev/popup/popup.html"))).toBe(true);
    expect(fs.existsSync(path.join(root, "dist_dev/background/background.js"))).toBe(true);
  });

  test("creates dist_prod and a production zip for publishing", async () => {
    execFileSync(process.execPath, ["scripts/build-extension.mjs", "prod"], {
      cwd: root,
      stdio: "pipe"
    });

    const manifest = readJson(path.join(root, "dist_prod/manifest.json"));
    const zipPath = path.join(root, `dist_prod/tabtotube-extension-v${manifest.version}.zip`);

    expect(manifest.name).toBe("TabToTube");
    expect(manifest.version).toBe("1.0.0");
    expect(manifest.version_name).toBe("1.0");
    expect(fs.existsSync(path.join(root, "dist_prod/offscreen/offscreen.js"))).toBe(true);
    expect(fs.statSync(zipPath).size).toBeGreaterThan(1024);
  });

  test("minifies production JavaScript and CSS", async () => {
    const popupJs = fs.readFileSync(path.join(root, "dist_prod/popup/popup.js"), "utf8");
    const popupCss = fs.readFileSync(path.join(root, "dist_prod/popup/popup.css"), "utf8");

    expect(popupJs.split(/\r?\n/).filter(Boolean).length).toBeLessThanOrEqual(2);
    expect(popupCss.split(/\r?\n/).filter(Boolean).length).toBeLessThanOrEqual(2);
    expect(popupJs.length).toBeLessThan(fs.readFileSync(path.join(root, "extension/popup/popup.js"), "utf8").length);
    expect(popupCss.length).toBeLessThan(fs.readFileSync(path.join(root, "extension/popup/popup.css"), "utf8").length);
  });

  test("keeps publish artifacts free from secret-like values", async () => {
    const files = listFiles(path.join(root, "dist_prod"))
      .filter((file) => [".css", ".html", ".js", ".json"].includes(path.extname(file)));
    const forbiddenPatterns = [/AIza[0-9A-Za-z_-]{35}/, /ya29\.[0-9A-Za-z_-]+/];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      for (const pattern of forbiddenPatterns) {
        expect(content, `${file} should not contain ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function listFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(absolutePath) : absolutePath;
  });
}
