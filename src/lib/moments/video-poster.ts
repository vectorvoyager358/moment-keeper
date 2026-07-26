const POSTER_MAX_EDGE = 480;
const POSTER_QUALITY = 0.72;
const VIDEO_READY_TIMEOUT_MS = 4_000;

function waitForVideoEvent(
  video: HTMLVideoElement,
  eventName: "loadedmetadata" | "loadeddata" | "seeked",
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Video preview timed out."));
    }, VIDEO_READY_TIMEOUT_MS);

    function cleanup() {
      window.clearTimeout(timeout);
      video.removeEventListener(eventName, handleReady);
      video.removeEventListener("error", handleError);
    }

    function handleReady() {
      cleanup();
      resolve();
    }

    function handleError() {
      cleanup();
      reject(new Error("Video preview is unavailable."));
    }

    video.addEventListener(eventName, handleReady, { once: true });
    video.addEventListener("error", handleError, { once: true });
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", POSTER_QUALITY);
  });
}

/**
 * Creates a small local poster for newly selected videos. Failure is
 * intentionally non-blocking because the original video is still valid media.
 */
export async function createVideoPosterFile(file: File): Promise<File | null> {
  if (typeof document === "undefined") {
    return null;
  }

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;

  try {
    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      await waitForVideoEvent(video, "loadedmetadata");
    }

    if (!video.videoWidth || !video.videoHeight) {
      return null;
    }

    const targetTime = Number.isFinite(video.duration)
      ? Math.min(0.1, Math.max(0, video.duration / 2))
      : 0;

    if (targetTime > 0) {
      video.currentTime = targetTime;
      await waitForVideoEvent(video, "seeked");
    } else if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await waitForVideoEvent(video, "loadeddata");
    }

    const scale = Math.min(
      1,
      POSTER_MAX_EDGE / Math.max(video.videoWidth, video.videoHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");

    if (!context) {
      return null;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToJpeg(canvas);

    if (!blob) {
      return null;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "video";
    return new File([blob], `${baseName}-poster.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return null;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
