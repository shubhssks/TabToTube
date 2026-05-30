export async function captureTabStream(streamId) {
  return captureChromeMedia({
    source: "tab",
    streamId,
    withAudio: true
  });
}

export function routeTabAudioToOutput(stream) {
  if (!stream.getAudioTracks().length) {
    return null;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContextClass();
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(audioContext.destination);
  return audioContext;
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

