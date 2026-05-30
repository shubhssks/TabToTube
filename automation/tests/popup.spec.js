const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { test, expect } = require("@playwright/test");

const extensionRoot = path.resolve(__dirname, "../../extension");
let popupUrl;
let server;

test.beforeAll(async () => {
  const port = 46000 + Math.floor(Math.random() * 10000);
  popupUrl = `http://127.0.0.1:${port}/popup/popup.html`;
  server = http.createServer(serveExtensionFile);

  await new Promise((resolve) => {
    server.listen(port, "127.0.0.1", resolve);
  });
});

test.afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__tabToTubeMessages = [];
    const storage = {
      bitrate: "2500000",
      companionUrl: "ws://127.0.0.1:43310/stream",
      rememberStreamKey: false,
      streamKey: ""
    };
    window.__tabToTubeStorage = storage;

    window.chrome = {
      runtime: {
        lastError: null,
        onMessage: {
          addListener(listener) {
            window.__tabToTubeRuntimeListener = listener;
          }
        },
        sendMessage(message, callback) {
          window.__tabToTubeMessages.push(message);

          if (message.type === "GET_STATUS") {
            callback({ ok: true, status: { state: "idle", startedAt: null, error: null } });
            return;
          }

          if (message.type === "START_STREAM") {
            callback({ ok: true, status: { state: "connecting", startedAt: null, error: null } });
            return;
          }

          if (message.type === "STOP_STREAM") {
            callback({ ok: true, status: { state: "idle", startedAt: null, error: null } });
          }
        }
      },
      storage: {
        local: {
          async get(keys) {
            return Object.fromEntries(keys.map((key) => [key, storage[key]]));
          },
          async set(values) {
            Object.assign(storage, values);
          },
          async remove(keys) {
            for (const key of Array.isArray(keys) ? keys : [keys]) {
              delete storage[key];
            }
          }
        }
      }
    };
  });

  await page.goto(popupUrl);
  await expect.poll(() => page.evaluate(() => window.__tabToTubeMessages.length)).toBeGreaterThan(0);
  await expect(page.locator("#statusText")).toHaveText("Idle");
});

test("renders the popup controls", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "TabToTube" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Stream key" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Remember stream key" })).toBeVisible();
  await expect(page.getByLabel("Companion URL")).toBeVisible();
  await expect(page.getByLabel("Video bitrate")).toBeVisible();
  await expect(page.getByText("Duration")).toBeVisible();
  await expect(page.getByText("Companion app required")).toBeVisible();
  await expect(page.getByText("Download it once from GitHub Releases")).toBeVisible();
  await expect(page.getByRole("link", { name: "Download" })).toHaveAttribute(
    "href",
    "https://github.com/shubhssks/TabToTube/releases/latest"
  );
  await expect(page.getByRole("button", { name: "Start" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Stop" })).toBeDisabled();
});

test("requires a stream key before starting", async ({ page }) => {
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.locator("#statusText")).toHaveText("Stream key is required");
});

test("sends the selected start-stream payload", async ({ page }) => {
  await page.getByRole("textbox", { name: "Stream key" }).fill("abcd-efgh-ijkl-mnop");
  await page.getByText("Screen", { exact: true }).click();
  await page.getByRole("button", { name: "Start" }).click();

  const startMessage = await page.evaluate(() => (
    window.__tabToTubeMessages.find((message) => message.type === "START_STREAM")
  ));

  expect(startMessage.payload).toMatchObject({
    bitrate: 2500000,
    companionUrl: "ws://127.0.0.1:43310/stream",
    source: "screen",
    streamKey: "abcd-efgh-ijkl-mnop"
  });
});

test("does not persist the stream key unless remember is checked", async ({ page }) => {
  await page.getByRole("textbox", { name: "Stream key" }).fill("abcd-efgh-ijkl-mnop");
  await page.getByRole("button", { name: "Start" }).click();

  const storage = await page.evaluate(() => window.__tabToTubeStorage);
  expect(storage.rememberStreamKey).toBe(false);
  expect(storage.streamKey).toBeUndefined();
  expect(storage.companionUrl).toBe("ws://127.0.0.1:43310/stream");
});

test("persists the stream key when remember is checked", async ({ page }) => {
  await page.getByRole("textbox", { name: "Stream key" }).fill("abcd-efgh-ijkl-mnop");
  await page.getByRole("checkbox", { name: "Remember stream key" }).check();
  await page.getByRole("button", { name: "Start" }).click();

  const storage = await page.evaluate(() => window.__tabToTubeStorage);
  expect(storage.rememberStreamKey).toBe(true);
  expect(storage.streamKey).toBe("abcd-efgh-ijkl-mnop");
});

test("keeps the GitHub companion download link visible when companion is missing", async ({ page }) => {
  await page.evaluate(() => {
    window.__tabToTubeRuntimeListener({
      type: "STATE_UPDATE",
      status: {
        state: "error",
        error: "Unable to connect to companion app"
      }
    });
  });

  const link = page.getByRole("link", { name: "Download" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "https://github.com/shubhssks/TabToTube/releases/latest");
});

function serveExtensionFile(request, response) {
  const requestUrl = new URL(request.url, "http://127.0.0.1");
  const relativePath = decodeURIComponent(requestUrl.pathname.replace(/^\/+/, ""));
  const filePath = path.resolve(extensionRoot, relativePath || "popup/popup.html");

  if (!filePath.startsWith(extensionRoot)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentType(filePath)
  });
  fs.createReadStream(filePath).pipe(response);
}

function contentType(filePath) {
  const extension = path.extname(filePath);
  if (extension === ".css") {
    return "text/css";
  }
  if (extension === ".html") {
    return "text/html";
  }
  if (extension === ".js") {
    return "application/javascript";
  }
  if (extension === ".json") {
    return "application/json";
  }
  return "application/octet-stream";
}
