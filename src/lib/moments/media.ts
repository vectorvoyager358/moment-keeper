import type { MediaType } from "@/lib/database.types";

export const MEDIA_BUCKET = "moment-media";

export const MEDIA_SIZE_LIMITS: Record<MediaType, number> = {
  photo: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  audio: 25 * 1024 * 1024,
};

const PHOTO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
]);

export const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
};

export function getMediaTypeFromMime(mimeType: string): MediaType | null {
  if (PHOTO_MIME_TYPES.has(mimeType)) {
    return "photo";
  }

  if (VIDEO_MIME_TYPES.has(mimeType)) {
    return "video";
  }

  if (AUDIO_MIME_TYPES.has(mimeType)) {
    return "audio";
  }

  return null;
}

export function extensionFromFile(file: Pick<File, "name" | "type">): string {
  const parts = file.name.split(".");
  const fromName = parts.length > 1 ? parts.pop()?.toLowerCase() : undefined;

  if (fromName && fromName.length <= 5) {
    return fromName;
  }

  return MIME_TO_EXTENSION[file.type] ?? "bin";
}

export function getMediaFileFromFormData(formData: FormData): File | null {
  const entry = formData.get("media");

  if (!(entry instanceof File) || entry.size === 0) {
    return null;
  }

  return entry;
}

export function validateMediaFile(file: File): string | null {
  const mediaType = getMediaTypeFromMime(file.type);

  if (!mediaType) {
    return "Unsupported file type. Use a photo, video, or audio file.";
  }

  const limit = MEDIA_SIZE_LIMITS[mediaType];

  if (file.size > limit) {
    const maxMb = limit / (1024 * 1024);
    return `File is too large. Max size for ${mediaType} is ${maxMb} MB.`;
  }

  return null;
}

export function shouldRemoveMedia(formData: FormData): boolean {
  return formData.get("remove_media") === "on";
}
