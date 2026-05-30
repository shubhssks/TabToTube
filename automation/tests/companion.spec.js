const { spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");
const WebSocket = require("ws");
const { test, expect } = require("@playwright/test");

const root = path.resolve(__dirname, "../..");
const companionDir = path.join(root, "companion-app");
const allowedOrigin = "chrome-extension://testid";

test.describe("companion app", () => {
  let server;
  let port;

  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    port = await getFreePort();
    server = spawn(process.execPath, ["server.js"], {
      cwd: companionDir,
      env: {
        ...process.env,
        ALLOWED_ORIGINS: allowedOrigin,
        PORT: String(port)
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });

    await waitForHealth(port);
  });

  test.afterAll(async () => {
    await stopServer(server);
  });

  test("returns health status", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      activeSessions: 0
    });
  });

  test("accepts configured extension origins", async () => {
    const ws = await openSocket(`ws://127.0.0.1:${port}/stream`, allowedOrigin);
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  test("rejects disallowed websocket origins", async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/stream`, {
      headers: {
        Origin: "https://example.com"
      }
    });

    const closeCode = await new Promise((resolve) => {
      ws.on("close", (code) => resolve(code));
      ws.on("error", () => resolve(1008));
    });

    expect(closeCode).toBe(1008);
  });

  test("reports invalid stream start messages without launching ffmpeg", async () => {
    const ws = await openSocket(`ws://127.0.0.1:${port}/stream`, allowedOrigin);
    ws.send(JSON.stringify({
      type: "start",
      streamKey: "short",
      bitrate: 2500000
    }));

    const errorMessage = await new Promise((resolve) => {
      ws.on("message", (message) => {
        resolve(JSON.parse(message.toString("utf8")));
      });
    });

    expect(errorMessage).toMatchObject({
      type: "error",
      error: "Invalid YouTube stream key length"
    });

    ws.close();
  });
});

function getFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      probe.close(() => resolve(address.port));
    });
  });
}

async function waitForHealth(serverPort) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10000) {
    try {
      const response = await fetch(`http://127.0.0.1:${serverPort}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error("Companion app did not become healthy");
}

function openSocket(url, origin) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, {
      headers: {
        Origin: origin
      }
    });

    ws.on("open", () => resolve(ws));
    ws.on("error", reject);
  });
}

function stopServer(childProcess) {
  return new Promise((resolve) => {
    if (!childProcess || childProcess.killed) {
      resolve();
      return;
    }

    const timeout = setTimeout(resolve, 2000);
    childProcess.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    childProcess.kill();
  });
}
