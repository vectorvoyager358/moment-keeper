import type { MediaType } from "@/lib/database.types";

export const MEDIA_BUCKET = "moment-media";
export const MAX_MEDIA_ATTACHMENTS = 5;
export const MAX_TOTAL_MEDIA_BYTES = 50 * 1024 * 1024;

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

export function getMediaFilesFromFormData(formData: FormData): File[] {
  return formData
    .getAll("media")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
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

export function validateMediaFiles(
  files: File[],
  existingCount = 0,
): string | null {
  if (existingCount + files.length > MAX_MEDIA_ATTACHMENTS) {
    return `Keep up to ${MAX_MEDIA_ATTACHMENTS} media attachments per moment.`;
  }

  for (const file of files) {
    const error = validateMediaFile(file);
    if (error) {
      return error;
    }
  }

  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > MAX_TOTAL_MEDIA_BYTES) {
    return "Combined media upload must be 50 MB or less.";
  }

  return null;
}

export function getRemovedMediaIds(formData: FormData): string[] {
  return [
    ...new Set(
      formData
        .getAll("remove_media_id")
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  ];
}
