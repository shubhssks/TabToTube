const DEFAULT_COMPANION_URL = "ws://127.0.0.1:43310/stream";

const elements = {
  bitrate: document.querySelector("#bitrate"),
  companionUrl: document.querySelector("#companionUrl"),
  duration: document.querySelector("#duration"),
  startButton: document.querySelector("#startButton"),
  statusDot: document.querySelector("#statusDot"),
  statusText: document.querySelector("#statusText"),
  stopButton: document.querySelector("#stopButton"),
  streamKey: document.querySelector("#streamKey")
};

let timerHandle = null;
let currentStatus = { state: "idle", startedAt: null };

init();

async function init() {
  const saved = await chrome.storage.local.get([
    "bitrate",
    "companionUrl",
    "streamKey"
  ]);

  elements.bitrate.value = saved.bitrate || "2500000";
  elements.companionUrl.value = saved.companionUrl || DEFAULT_COMPANION_URL;
  elements.streamKey.value = saved.streamKey || "";

  elements.startButton.addEventListener("click", startStream);
  elements.stopButton.addEventListener("click", stopStream);
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "STATE_UPDATE") {
      applyStatus(message.status);
    }
  });

  try {
    const status = await sendMessage({ type: "GET_STATUS" });
    applyStatus(status);
  } catch (error) {
    applyStatus({
      state: "error",
      error: "Background worker unavailable"
    });
  }
}

async function startStream() {
  const streamKey = elements.streamKey.value.trim();
  const companionUrl = elements.companionUrl.value.trim() || DEFAULT_COMPANION_URL;
  const bitrate = Number(elements.bitrate.value);
  const source = document.querySelector("input[name='source']:checked").value;

  if (!streamKey) {
    applyStatus({ state: "error", error: "Stream key is required" });
    elements.streamKey.focus();
    return;
  }

  await chrome.storage.local.set({
    bitrate: String(bitrate),
    companionUrl,
    streamKey
  });

  elements.startButton.disabled = true;
  applyStatus({ state: "connecting", startedAt: null });

  try {
    const status = await sendMessage({
      type: "START_STREAM",
      payload: {
        bitrate,
        companionUrl,
        source,
        streamKey
      }
    });
    applyStatus(status);
  } catch (error) {
    applyStatus({
      state: "error",
      error: error.message || "Unable to start stream"
    });
  }
}

async function stopStream() {
  elements.stopButton.disabled = true;
  try {
    const status = await sendMessage({ type: "STOP_STREAM" });
    applyStatus(status);
  } catch (error) {
    applyStatus({
      state: "error",
      error: error.message || "Unable to stop stream"
    });
  }
}

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      if (response?.ok === false) {
        reject(new Error(response.error || "Request failed"));
        return;
      }

      resolve(response?.status ?? response);
    });
  });
}

function applyStatus(status = {}) {
  currentStatus = {
    ...currentStatus,
    ...status
  };

  const state = currentStatus.state || "idle";
  elements.statusDot.className = `status-dot ${state}`;
  elements.statusText.textContent = statusLabel(currentStatus);
  elements.startButton.disabled = state === "connecting" || state === "live";
  elements.stopButton.disabled = state !== "connecting" && state !== "live";

  if (state === "live" && currentStatus.startedAt) {
    startTimer();
  } else if (state !== "live") {
    stopTimer();
    elements.duration.textContent = "00:00:00";
  }
}

function statusLabel(status) {
  if (status.state === "connecting") {
    return "Connecting";
  }

  if (status.state === "live") {
    return "Live";
  }

  if (status.state === "error") {
    return status.error || "Error";
  }

  return "Idle";
}

function startTimer() {
  stopTimer();
  renderDuration();
  timerHandle = setInterval(renderDuration, 1000);
}

function stopTimer() {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

function renderDuration() {
  const startedAt = Number(currentStatus.startedAt);
  if (!startedAt) {
    elements.duration.textContent = "00:00:00";
    return;
  }

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const hours = String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");
  elements.duration.textContent = `${hours}:${minutes}:${seconds}`;
}

