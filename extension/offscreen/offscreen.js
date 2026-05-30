import { captureDesktopStream } from "../capture/screenCapture.js";
import { captureTabStream, routeTabAudioToOutput } from "../capture/tabCapture.js";
import { WebMChunkStreamer } from "../streaming/encoder.js";

const preview = document.querySelector("#preview");

let activeStream = null;
let activeStreamer = null;
let activeAudioRoute = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message)
    .then((response) => sendResponse({ ok: true, status: response }))
    .catch((error) => {
      publishState({
        state: "error",
        error: error.message || "Offscreen processing failed"
      });
      sendResponse({ ok: false, error: error.message });
    });

  return true;
});

async function handleMessage(message) {
  switch (message?.type) {
    case "START_STREAM":
      return startStream(message.payload);
    case "STOP_STREAM":
      return stopStream();
    default:
      return undefined;
  }
}

async function startStream(payload = {}) {
  await stopStream();
  publishState({ state: "connecting", error: null, startedAt: null });

  activeStream = payload.capture.source === "desktop"
    ? await captureDesktopStream(payload.capture.streamId)
    : await captureTabStream(payload.capture.streamId);

  preview.srcObject = activeStream;
  await preview.play().catch(() => {});

  if (payload.capture.source === "tab") {
    activeAudioRoute = routeTabAudioToOutput(activeStream);
  }

  activeStreamer = new WebMChunkStreamer({
    bitrate: payload.bitrate,
    companionUrl: payload.companionUrl,
    streamKey: payload.streamKey
  });

  activeStreamer.addEventListener("state", (event) => {
    publishState(event.detail);
  });

  await activeStreamer.start(activeStream);
  return publishState({
    state: "live",
    startedAt: Date.now(),
    error: null
  });
}

async function stopStream() {
  if (activeStreamer) {
    await activeStreamer.stop();
    activeStreamer = null;
  }

  if (activeAudioRoute) {
    await activeAudioRoute.close().catch(() => {});
    activeAudioRoute = null;
  }

  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
    activeStream = null;
  }

  preview.srcObject = null;

  return publishState({
    state: "idle",
    startedAt: null,
    error: null
  });
}

function publishState(status) {
  try {
    const maybePromise = chrome.runtime.sendMessage({
      type: "OFFSCREEN_STATE",
      status
    });
    if (maybePromise?.catch) {
      maybePromise.catch(() => {});
    }
  } catch {
    // The service worker may be between wakeups; popup GET_STATUS will recover.
  }

  return status;
}
