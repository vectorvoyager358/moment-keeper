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

const MIME_ALIASES: Record<string, string> = {
  "video/x-quicktime": "video/quicktime",
  "video/hevc": "video/quicktime",
  "video/h265": "video/quicktime",
};

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

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  ogg: "audio/ogg",
};

function normalizedMimeValue(mimeType: string): string {
  const normalized = mimeType.toLowerCase().split(";", 1)[0].trim();
  return MIME_ALIASES[normalized] ?? normalized;
}

export function getMediaTypeFromMime(mimeType: string): MediaType | null {
  const normalized = normalizedMimeValue(mimeType);

  if (PHOTO_MIME_TYPES.has(normalized)) {
    return "photo";
  }

  if (VIDEO_MIME_TYPES.has(normalized)) {
    return "video";
  }

  if (AUDIO_MIME_TYPES.has(normalized)) {
    return "audio";
  }

  return null;
}

export function getNormalizedMediaMimeType(
  file: Pick<File, "name" | "type">,
): string | null {
  const normalized = normalizedMimeValue(file.type);

  if (getMediaTypeFromMime(normalized)) {
    return normalized;
  }

  if (normalized && normalized !== "application/octet-stream") {
    return null;
  }

  const extension = extensionFromFileName(file.name);
  return extension ? (EXTENSION_TO_MIME[extension] ?? null) : null;
}

export function getMediaTypeFromFile(
  file: Pick<File, "name" | "type">,
): MediaType | null {
  const mimeType = getNormalizedMediaMimeType(file);
  return mimeType ? getMediaTypeFromMime(mimeType) : null;
}

export function normalizeMediaFileType(file: File): File {
  const mimeType = getNormalizedMediaMimeType(file);

  if (!mimeType || mimeType === file.type) {
    return file;
  }

  return new File([file], file.name, {
    type: mimeType,
    lastModified: file.lastModified,
  });
}

function extensionFromFileName(name: string): string | null {
  const parts = name.split(".");
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : undefined;
  return extension && extension.length <= 5 ? extension : null;
}

export function extensionFromFile(file: Pick<File, "name" | "type">): string {
  const fromName = extensionFromFileName(file.name);

  if (fromName) {
    return fromName;
  }

  const mimeType = getNormalizedMediaMimeType(file);
  return mimeType ? (MIME_TO_EXTENSION[mimeType] ?? "bin") : "bin";
}

export function getMediaFilesFromFormData(formData: FormData): File[] {
  return formData
    .getAll("media")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export function parseMediaThumbnailsFromFormData(
  formData: FormData,
  mediaCount: number,
):
  | { thumbnails: (File | null)[]; error: null }
  | { thumbnails: []; error: string } {
  const indexes = formData.getAll("media_thumbnail_index");
  const files = formData
    .getAll("media_thumbnail")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (indexes.length !== files.length) {
    return { thumbnails: [], error: "Invalid video thumbnail data." };
  }

  const thumbnails: (File | null)[] = Array(mediaCount).fill(null);
  const seen = new Set<number>();

  for (const [position, rawIndex] of indexes.entries()) {
    const index = Number(rawIndex);
    const file = files[position];

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= mediaCount ||
      seen.has(index) ||
      file.type !== "image/jpeg" ||
      file.size > 2 * 1024 * 1024
    ) {
      return { thumbnails: [], error: "Invalid video thumbnail data." };
    }

    seen.add(index);
    thumbnails[index] = file;
  }

  return { thumbnails, error: null };
}

export function validateMediaFile(file: File): string | null {
  const mediaType = getMediaTypeFromFile(file);

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
