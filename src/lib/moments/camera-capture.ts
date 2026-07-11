import { MIME_TO_EXTENSION } from "@/lib/moments/media";

export type CameraFacingMode = "user" | "environment";

/** Cap in-camera video to keep uploads within the 50 MB moment limit. */
export const MAX_CAMERA_VIDEO_MS = 2 * 60 * 1000;

export const VISUAL_ZOOM_MIN = 1;
export const VISUAL_ZOOM_MAX = 3;

const CAMERA_VIDEO_MIME_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
] as const;

export type ZoomCapabilities = {
  min: number;
  max: number;
  step: number;
  hardware: boolean;
};

type ZoomCapabilityRange = {
  min?: number;
  max?: number;
  step?: number;
};

export function isCameraSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof document !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined"
  );
}

/** Mobile browsers open the native camera app when file inputs use `capture`. */
export function prefersNativeCamera(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(max-width: 768px)").matches
  );
}

export const NATIVE_PHOTO_CAPTURE_ACCEPT = "image/*";
export const NATIVE_VIDEO_CAPTURE_ACCEPT =
  "video/mp4,video/quicktime,video/webm,video/*";

export function isVideoCaptureSupported(): boolean {
  return (
    isCameraSupported() &&
    typeof MediaRecorder !== "undefined" &&
    getSupportedCameraVideoMimeType() !== null
  );
}

export function getSupportedCameraVideoMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") {
    return null;
  }

  for (const type of CAMERA_VIDEO_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return null;
}

export function toggleFacingMode(current: CameraFacingMode): CameraFacingMode {
  return current === "environment" ? "user" : "environment";
}

export function getVideoTrack(
  stream: MediaStream | null,
): MediaStreamTrack | null {
  return stream?.getVideoTracks()[0] ?? null;
}

export function getZoomCapabilities(
  track: MediaStreamTrack | null,
): ZoomCapabilities {
  if (track && "getCapabilities" in track) {
    const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
      zoom?: ZoomCapabilityRange;
    };

    if (capabilities.zoom) {
      return {
        min: capabilities.zoom.min ?? VISUAL_ZOOM_MIN,
        max: capabilities.zoom.max ?? VISUAL_ZOOM_MAX,
        step: capabilities.zoom.step ?? 0.1,
        hardware: true,
      };
    }
  }

  return {
    min: VISUAL_ZOOM_MIN,
    max: VISUAL_ZOOM_MAX,
    step: 0.1,
    hardware: false,
  };
}

export async function applyCameraZoom(
  track: MediaStreamTrack | null,
  zoom: number,
  capabilities: ZoomCapabilities,
): Promise<void> {
  if (!track || !capabilities.hardware || !("applyConstraints" in track)) {
    return;
  }

  await track.applyConstraints({
    advanced: [{ zoom } as MediaTrackConstraintSet],
  });
}

export function clampZoom(
  zoom: number,
  capabilities: ZoomCapabilities,
): number {
  const step = capabilities.step || 0.1;
  const snapped = Math.round(zoom / step) * step;
  return Math.min(capabilities.max, Math.max(capabilities.min, snapped));
}

export function buildCameraPhotoFileName(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `photo-${timestamp}.jpg`;
}

export function normalizeCameraVideoMimeType(mimeType: string): string {
  return mimeType.split(";")[0]?.trim() ?? mimeType;
}

export function buildCameraVideoFileName(mimeType: string): string {
  const normalized = normalizeCameraVideoMimeType(mimeType);
  const extension = MIME_TO_EXTENSION[normalized] ?? "webm";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `video-${timestamp}.${extension}`;
}

export function buildCameraVideoFile(blob: Blob, mimeType: string): File {
  const normalized = normalizeCameraVideoMimeType(mimeType);
  return new File([blob], buildCameraVideoFileName(mimeType), {
    type: normalized,
  });
}

export async function capturePhotoFromVideo(
  video: HTMLVideoElement,
  visualZoom = 1,
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

  const zoom = Math.max(1, visualZoom);

  if (zoom > 1) {
    const sourceWidth = video.videoWidth / zoom;
    const sourceHeight = video.videoHeight / zoom;
    const sourceX = (video.videoWidth - sourceWidth) / 2;
    const sourceY = (video.videoHeight - sourceHeight) / 2;
    context.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  } else {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
  }

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

export async function openCameraStream(
  facingMode: CameraFacingMode = "environment",
  includeAudio = false,
): Promise<MediaStream> {
  const attempts: MediaStreamConstraints[] = [
    {
      video: { facingMode: { exact: facingMode } },
      audio: includeAudio,
    },
    {
      video: { facingMode: { ideal: facingMode } },
      audio: includeAudio,
    },
    {
      video: { facingMode },
      audio: includeAudio,
    },
    {
      video: true,
      audio: includeAudio,
    },
  ];

  let lastError: unknown;

  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Could not open the camera.");
}

export function formatRecordingDuration(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatZoomLabel(zoom: number): string {
  return `${zoom.toFixed(1)}x`;
}
