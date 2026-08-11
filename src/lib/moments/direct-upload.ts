import {
  MAX_MEDIA_ATTACHMENTS,
  MEDIA_SIZE_LIMITS,
  MIME_TO_EXTENSION,
  getMediaTypeFromMime,
} from "@/lib/moments/media";
import { thumbnailStoragePath } from "@/lib/moments/thumbnails";

export const DIRECT_MEDIA_FORM_FIELD = "direct_media";

export type DirectUploadedMedia = {
  id: string;
  clientIndex: number;
  storagePath: string;
  thumbnailPath: string | null;
  mimeType: string;
  fileSize: number;
  originalFilename: string;
};

type DirectMediaParseResult =
  | { uploads: DirectUploadedMedia[]; error: null }
  | { uploads: []; error: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function parseDirectUploadedMedia(
  formData: FormData,
): DirectMediaParseResult {
  const raw = formData.get(DIRECT_MEDIA_FORM_FIELD);

  if (raw === null || raw === "") {
    return { uploads: [], error: null };
  }

  if (typeof raw !== "string") {
    return { uploads: [], error: "Invalid uploaded media data." };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length > MAX_MEDIA_ATTACHMENTS) {
      return { uploads: [], error: "Invalid uploaded media data." };
    }

    const uploads: DirectUploadedMedia[] = [];
    for (const item of parsed) {
      if (
        !isRecord(item) ||
        typeof item.id !== "string" ||
        typeof item.clientIndex !== "number" ||
        typeof item.storagePath !== "string" ||
        (item.thumbnailPath !== null &&
          typeof item.thumbnailPath !== "string") ||
        typeof item.mimeType !== "string" ||
        typeof item.fileSize !== "number" ||
        typeof item.originalFilename !== "string"
      ) {
        return { uploads: [], error: "Invalid uploaded media data." };
      }

      uploads.push({
        id: item.id,
        clientIndex: item.clientIndex,
        storagePath: item.storagePath,
        thumbnailPath: item.thumbnailPath,
        mimeType: item.mimeType,
        fileSize: item.fileSize,
        originalFilename: item.originalFilename,
      });
    }

    return { uploads, error: null };
  } catch {
    return { uploads: [], error: "Invalid uploaded media data." };
  }
}

export function validateDirectUploadedMedia(
  uploads: DirectUploadedMedia[],
  userId: string,
  momentId: string,
): string | null {
  const ids = new Set<string>();
  const indexes = new Set<number>();
  const paths = new Set<string>();

  for (const upload of uploads) {
    const mediaType = getMediaTypeFromMime(upload.mimeType);
    const extension = MIME_TO_EXTENSION[upload.mimeType];

    if (
      !isUuid(upload.id) ||
      mediaType !== "video" ||
      !extension ||
      !Number.isInteger(upload.clientIndex) ||
      upload.clientIndex < 0 ||
      upload.clientIndex >= MAX_MEDIA_ATTACHMENTS ||
      !Number.isInteger(upload.fileSize) ||
      upload.fileSize <= 0 ||
      upload.fileSize > MEDIA_SIZE_LIMITS.video ||
      upload.originalFilename.length === 0 ||
      upload.originalFilename.length > 255
    ) {
      return "Invalid uploaded media data.";
    }

    const expectedPath = `${userId}/${momentId}/${upload.id}.${extension}`;
    const expectedThumbnailPath = thumbnailStoragePath(expectedPath);
    if (
      upload.storagePath !== expectedPath ||
      (upload.thumbnailPath !== null &&
        upload.thumbnailPath !== expectedThumbnailPath) ||
      ids.has(upload.id) ||
      indexes.has(upload.clientIndex) ||
      paths.has(upload.storagePath)
    ) {
      return "Invalid uploaded media data.";
    }

    ids.add(upload.id);
    indexes.add(upload.clientIndex);
    paths.add(upload.storagePath);
  }

  return null;
}

export function parseMediaClientIndexes(
  formData: FormData,
  mediaCount: number,
): { indexes: number[]; error: string | null } {
  const rawIndexes = formData.getAll("media_client_index");

  if (rawIndexes.length === 0) {
    return {
      indexes: Array.from({ length: mediaCount }, (_, index) => index),
      error: null,
    };
  }

  if (rawIndexes.length !== mediaCount) {
    return { indexes: [], error: "Invalid uploaded media order." };
  }

  const indexes = rawIndexes.map(Number);
  if (
    indexes.some(
      (index) =>
        !Number.isInteger(index) || index < 0 || index >= MAX_MEDIA_ATTACHMENTS,
    ) ||
    new Set(indexes).size !== indexes.length
  ) {
    return { indexes: [], error: "Invalid uploaded media order." };
  }

  return { indexes, error: null };
}

export function validateCombinedMediaIndexes(
  fileIndexes: number[],
  directUploads: DirectUploadedMedia[],
): string | null {
  const indexes = [
    ...fileIndexes,
    ...directUploads.map((upload) => upload.clientIndex),
  ].sort((a, b) => a - b);

  if (
    indexes.length > MAX_MEDIA_ATTACHMENTS ||
    indexes.some((index, position) => index !== position)
  ) {
    return "Invalid uploaded media order.";
  }

  return null;
}
