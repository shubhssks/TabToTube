export async function captureDesktopStream(streamId) {
  return captureChromeMedia({
    source: "desktop",
    streamId,
    withAudio: true
  });
}

async function captureChromeMedia({ source, streamId, withAudio }) {
  const video = {
    mandatory: {
      chromeMediaSource: source,
      chromeMediaSourceId: streamId,
      maxFrameRate: 30
    }
  };

  const audio = withAudio
    ? {
        mandatory: {
          chromeMediaSource: source,
          chromeMediaSourceId: streamId
        }
      }
    : false;

  try {
    return await navigator.mediaDevices.getUserMedia({ audio, video });
  } catch (error) {
    if (!withAudio) {
      throw error;
    }

    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video
    });
  }
}

