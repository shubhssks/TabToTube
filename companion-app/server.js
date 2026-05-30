const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");
const express = require("express");
const WebSocket = require("ws");
const logger = require("./utils/logger");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 43310);
const RTMP_BASE_URL = process.env.RTMP_BASE_URL || "rtmp://a.rtmp.youtube.com/live2";
const FFMPEG_PATH = resolveFfmpegPath();
const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/stream" });

const sessions = new Set();

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    activeSessions: sessions.size,
    ffmpegPath: FFMPEG_PATH
  });
});

wss.on("connection", (ws, req) => {
  const remoteAddress = req.socket.remoteAddress;
  const origin = req.headers.origin;

  if (!isAllowedOrigin(origin)) {
    logger.warn(`Rejected WebSocket origin: ${origin || "none"}`);
    ws.close(1008, "Origin not allowed");
    return;
  }

  logger.info(`WebSocket connected from ${remoteAddress}`);

  const session = {
    ffmpeg: null,
    started: false,
    ws
  };
  sessions.add(session);

  ws.on("message", (message, isBinary) => {
    try {
      if (!isBinary) {
        handleControlMessage(session, message.toString("utf8"));
        return;
      }

      writeChunk(session, message);
    } catch (error) {
      logger.error(error.message);
      sendError(ws, error.message);
      stopSession(session);
    }
  });

  ws.on("close", () => {
    logger.info("WebSocket disconnected");
    stopSession(session);
    sessions.delete(session);
  });

  ws.on("error", (error) => {
    logger.error(`WebSocket error: ${error.message}`);
    stopSession(session);
    sessions.delete(session);
  });
});

server.listen(PORT, HOST, () => {
  logger.info(`Companion app listening on ws://${HOST}:${PORT}/stream`);
  logger.info(`Health check available at http://${HOST}:${PORT}/health`);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function handleControlMessage(session, rawMessage) {
  const message = JSON.parse(rawMessage);

  if (message.type === "start") {
    if (session.started) {
      throw new Error("Stream already started");
    }

    startFfmpeg(session, message);
    return;
  }

  if (message.type === "stop") {
    stopSession(session);
    return;
  }

  throw new Error(`Unknown control message: ${message.type}`);
}

function startFfmpeg(session, options) {
  validateStreamOptions(options);

  const bitrateKbps = Math.max(500, Math.round(Number(options.bitrate || 2500000) / 1000));
  const rtmpUrl = `${RTMP_BASE_URL}/${options.streamKey}`;
  const args = [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-fflags",
    "+genpts",
    "-use_wallclock_as_timestamps",
    "1",
    "-f",
    "webm",
    "-i",
    "pipe:0",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-maxrate",
    `${bitrateKbps}k`,
    "-bufsize",
    `${bitrateKbps * 2}k`,
    "-pix_fmt",
    "yuv420p",
    "-g",
    "50",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-f",
    "flv",
    rtmpUrl
  ];

  logger.info(`Starting FFmpeg at ${FFMPEG_PATH}`);
  session.ffmpeg = spawn(FFMPEG_PATH, args, {
    stdio: ["pipe", "ignore", "pipe"],
    windowsHide: true
  });

  session.started = true;

  session.ffmpeg.stderr.on("data", (chunk) => {
    logger.warn(`ffmpeg: ${chunk.toString("utf8").trim()}`);
  });

  session.ffmpeg.on("exit", (code, signal) => {
    session.started = false;
    session.ffmpeg = null;
    const message = `FFmpeg exited with code ${code ?? "null"} signal ${signal ?? "null"}`;
    if (code === 0 || signal === "SIGTERM") {
      logger.info(message);
    } else {
      logger.error(message);
      sendError(session.ws, message);
    }
  });

  session.ffmpeg.on("error", (error) => {
    session.started = false;
    session.ffmpeg = null;
    logger.error(`Failed to start FFmpeg: ${error.message}`);
    sendError(session.ws, error.message);
  });
}

function writeChunk(session, chunk) {
  if (!session.ffmpeg?.stdin?.writable) {
    throw new Error("FFmpeg is not ready");
  }

  const canContinue = session.ffmpeg.stdin.write(chunk);
  if (!canContinue && session.ws._socket) {
    session.ws._socket.pause();
    session.ffmpeg.stdin.once("drain", () => {
      if (session.ws.readyState === WebSocket.OPEN) {
        session.ws._socket.resume();
      }
    });
  }
}

function stopSession(session) {
  if (!session.ffmpeg) {
    session.started = false;
    return;
  }

  session.ffmpeg.stdin.end();
  session.ffmpeg.kill("SIGTERM");
  session.ffmpeg = null;
  session.started = false;
}

function validateStreamOptions(options) {
  if (!options.streamKey || typeof options.streamKey !== "string") {
    throw new Error("Missing YouTube stream key");
  }

  if (options.streamKey.length < 8 || options.streamKey.length > 256) {
    throw new Error("Invalid YouTube stream key length");
  }
}

function sendError(ws, error) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: "error",
      error
    }));
  }
}

function resolveFfmpegPath() {
  if (process.env.FFMPEG_PATH) {
    return process.env.FFMPEG_PATH;
  }

  const localBinary = path.join(__dirname, "bin", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
  if (fs.existsSync(localBinary)) {
    return localBinary;
  }

  return "ffmpeg";
}

function parseAllowedOrigins(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin) {
  if (!origin) {
    return false;
  }

  if (ALLOWED_ORIGINS.length > 0) {
    return ALLOWED_ORIGINS.includes(origin);
  }

  return origin.startsWith("chrome-extension://");
}

function shutdown() {
  logger.info("Shutting down companion app");
  for (const session of sessions) {
    stopSession(session);
  }
  server.close(() => process.exit(0));
}
