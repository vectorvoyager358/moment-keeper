export function isCameraSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof document !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined"
  );
}

export function buildCameraPhotoFileName(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `photo-${timestamp}.jpg`;
}

export async function capturePhotoFromVideo(
  video: HTMLVideoElement,
): Promise<File> {
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    throw new Error("Camera is not ready yet. Try again in a moment.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not capture that photo.");
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Could not capture that photo."));
          return;
        }

        resolve(result);
      },
      "image/jpeg",
      0.92,
    );
  });

  return new File([blob], buildCameraPhotoFileName(), { type: "image/jpeg" });
}

export async function openCameraStream(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
  } catch {
    return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }
}
