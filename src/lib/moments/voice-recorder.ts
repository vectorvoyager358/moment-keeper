import { MIME_TO_EXTENSION } from "@/lib/moments/media";

/** Cap recordings at 10 minutes — well under the 25 MB audio upload limit. */
export const MAX_VOICE_MEMO_MS = 10 * 60 * 1000;

const VOICE_MEMO_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
] as const;

export function isVoiceMemoSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    getSupportedVoiceMemoMimeType() !== null
  );
}

export function getSupportedVoiceMemoMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") {
    return null;
  }

  for (const type of VOICE_MEMO_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return null;
}

export function normalizeVoiceMemoMimeType(mimeType: string): string {
  return mimeType.split(";")[0]?.trim() ?? mimeType;
}

export function buildVoiceMemoFile(blob: Blob, mimeType: string): File {
  const normalized = normalizeVoiceMemoMimeType(mimeType);
  const extension = MIME_TO_EXTENSION[normalized] ?? "webm";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return new File([blob], `voice-memo-${timestamp}.${extension}`, {
    type: normalized,
  });
}

export function formatRecordingDuration(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
