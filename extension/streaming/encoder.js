const DEFAULT_BITRATE = 2500000;
const SOCKET_BUFFER_LIMIT = 8 * 1024 * 1024;
const TIMESLICE_MS = 1000;

export class WebMChunkStreamer extends EventTarget {
  constructor({ bitrate = DEFAULT_BITRATE, companionUrl, streamKey }) {
    super();
    this.bitrate = Number(bitrate) || DEFAULT_BITRATE;
    this.companionUrl = companionUrl;
    this.streamKey = streamKey;
    this.mediaRecorder = null;
    this.socket = null;
    this.stopping = false;
  }

  async start(stream) {
    if (!stream?.getTracks().length) {
      throw new Error("No media tracks available");
    }

    this.socket = await this.openSocket();
    this.socket.send(JSON.stringify({
      type: "start",
      streamKey: this.streamKey,
      bitrate: this.bitrate
    }));

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: selectMimeType(),
      videoBitsPerSecond: this.bitrate,
      audioBitsPerSecond: 128000
    });

    this.mediaRecorder.addEventListener("dataavailable", (event) => {
      this.sendChunk(event.data);
    });

    this.mediaRecorder.addEventListener("error", (event) => {
      this.publish({
        state: "error",
        error: event.error?.message || "MediaRecorder failed"
      });
    });

    this.mediaRecorder.addEventListener("stop", () => {
      if (!this.stopping) {
        this.publish({
          state: "idle",
          startedAt: null
        });
      }
    });

    this.mediaRecorder.start(TIMESLICE_MS);
    this.publish({
      state: "live",
      startedAt: Date.now(),
      error: null
    });
  }

  async stop() {
    this.stopping = true;

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "stop" }));
      this.socket.close(1000, "Stopped by user");
    }

    this.mediaRecorder = null;
    this.socket = null;
    this.stopping = false;
  }

  openSocket() {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.companionUrl);
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error("Companion connection timed out"));
      }, 8000);

      socket.binaryType = "arraybuffer";

      socket.addEventListener("open", () => {
        clearTimeout(timeout);
        resolve(socket);
      }, { once: true });

      socket.addEventListener("error", () => {
        clearTimeout(timeout);
        reject(new Error("Unable to connect to companion app"));
      }, { once: true });

      socket.addEventListener("close", (event) => {
        if (!this.stopping && event.code !== 1000) {
          this.publish({
            state: "error",
            error: "Companion connection closed"
          });
        }
      });

      socket.addEventListener("message", (event) => {
        this.handleSocketMessage(event.data);
      });
    });
  }

  async sendChunk(blob) {
    if (!blob?.size || this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    if (this.socket.bufferedAmount > SOCKET_BUFFER_LIMIT) {
      this.publish({
        state: "error",
        error: "Companion app is not keeping up with the stream"
      });
      await this.stop();
      return;
    }

    const data = await blob.arrayBuffer();
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    }
  }

  handleSocketMessage(rawMessage) {
    try {
      const message = JSON.parse(rawMessage);
      if (message.type === "error") {
        this.publish({
          state: "error",
          error: message.error || "Companion app error"
        });
      }
    } catch {
      // Binary messages are not expected from the companion app.
    }
  }

  publish(detail) {
    this.dispatchEvent(new CustomEvent("state", { detail }));
  }
}

function selectMimeType() {
  const candidates = [
    "video/webm; codecs=vp8,opus",
    "video/webm; codecs=vp8",
    "video/webm"
  ];

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || "";
}

