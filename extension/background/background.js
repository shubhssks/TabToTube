const OFFSCREEN_URL = "offscreen/offscreen.html";

let status = {
  state: "idle",
  startedAt: null,
  error: null
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((response) => sendResponse({ ok: true, status: response }))
    .catch((error) => {
      const nextStatus = setStatus({
        state: "error",
        error: error.message || "Unexpected error"
      });
      sendResponse({ ok: false, error: nextStatus.error, status: nextStatus });
    });

  return true;
});

async function handleMessage(message) {
  switch (message?.type) {
    case "GET_STATUS":
      return status;
    case "START_STREAM":
      return startStream(message.payload);
    case "STOP_STREAM":
      return stopStream();
    case "OFFSCREEN_STATE":
      return setStatus(message.status);
    default:
      throw new Error("Unknown message");
  }
}

async function startStream(payload = {}) {
  validateStartPayload(payload);
  await ensureOffscreenDocument();

  const nextStatus = setStatus({
    state: "connecting",
    startedAt: null,
    error: null
  });

  const capture = payload.source === "screen"
    ? await requestDesktopStreamId()
    : await requestTabStreamId();

  await sendToOffscreen({
    type: "START_STREAM",
    payload: {
      ...payload,
      capture
    }
  });

  return nextStatus;
}

async function stopStream() {
  if (await hasOffscreenDocument()) {
    await sendToOffscreen({ type: "STOP_STREAM" });
  }

  return setStatus({
    state: "idle",
    startedAt: null,
    error: null
  });
}

function validateStartPayload(payload) {
  if (!payload.streamKey || typeof payload.streamKey !== "string") {
    throw new Error("Stream key is required");
  }

  if (!payload.companionUrl || typeof payload.companionUrl !== "string") {
    throw new Error("Companion URL is required");
  }

  if (!["tab", "screen"].includes(payload.source)) {
    throw new Error("Unsupported capture source");
  }
}

async function requestTabStreamId() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab?.id) {
    throw new Error("No active tab found");
  }

  const streamId = await new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id }, (id) => {
      const error = chrome.runtime.lastError;
      if (error || !id) {
        reject(new Error(error?.message || "Unable to capture active tab"));
        return;
      }
      resolve(id);
    });
  });

  return {
    source: "tab",
    streamId
  };
}

async function requestDesktopStreamId() {
  const streamId = await new Promise((resolve, reject) => {
    chrome.desktopCapture.chooseDesktopMedia(
      ["screen", "window", "tab", "audio"],
      (id) => {
        const error = chrome.runtime.lastError;
        if (error || !id) {
          reject(new Error(error?.message || "Screen capture was cancelled"));
          return;
        }
        resolve(id);
      }
    );
  });

  return {
    source: "desktop",
    streamId
  };
}

async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ["USER_MEDIA", "BLOBS"],
    justification: "Capture and encode media for local streaming."
  });
}

async function hasOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_URL);
  const clients = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl]
  });
  return clients.length > 0;
}

function sendToOffscreen(message) {
  return chrome.runtime.sendMessage(message);
}

function setStatus(nextStatus) {
  status = {
    ...status,
    ...nextStatus
  };

  broadcastMessage({
    type: "STATE_UPDATE",
    status
  });

  return status;
}

function broadcastMessage(message) {
  try {
    const maybePromise = chrome.runtime.sendMessage(message);
    if (maybePromise?.catch) {
      maybePromise.catch(() => {});
    }
  } catch {
    // The popup may be closed; status remains available through GET_STATUS.
  }
}
