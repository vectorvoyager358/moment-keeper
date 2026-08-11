"use client";

import { createClient } from "@/lib/supabase/client";
import type { DirectUploadedMedia } from "@/lib/moments/direct-upload";
import {
  getNormalizedMediaMimeType,
  MEDIA_BUCKET,
  MIME_TO_EXTENSION,
  validateMediaFile,
} from "@/lib/moments/media";
import { thumbnailStoragePath } from "@/lib/moments/thumbnails";

type DirectVideoInput = {
  file: File;
  thumbnail: File | null;
  clientIndex: number;
};

type UploadDirectVideosOptions = {
  userId: string;
  momentId: string;
  videos: DirectVideoInput[];
  onProgress?: (percent: number) => void;
};

function uploadErrorMessage(fileName: string, error: unknown): string {
  const detail =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "The storage service rejected the upload.";
  return `Could not upload ${fileName}. ${detail}`;
}

export async function removeDirectUploads(
  uploads: DirectUploadedMedia[],
): Promise<void> {
  if (uploads.length === 0) {
    return;
  }

  const paths = uploads.flatMap((upload) => [
    upload.storagePath,
    ...(upload.thumbnailPath ? [upload.thumbnailPath] : []),
  ]);
  const supabase = createClient();
  await supabase.storage.from(MEDIA_BUCKET).remove(paths);
}

export async function uploadVideosDirectly({
  userId,
  momentId,
  videos,
  onProgress,
}: UploadDirectVideosOptions): Promise<DirectUploadedMedia[]> {
  if (videos.length === 0) {
    return [];
  }

  const supabase = createClient();
  const bucket = supabase.storage.from(MEDIA_BUCKET);
  const uploadedPaths: string[] = [];
  const uploads: DirectUploadedMedia[] = [];
  const totalBytes = videos.reduce(
    (total, video) => total + video.file.size + (video.thumbnail?.size ?? 0),
    0,
  );
  let completedBytes = 0;

  try {
    for (const { file, thumbnail, clientIndex } of videos) {
      const validationError = validateMediaFile(file);
      const mimeType = getNormalizedMediaMimeType(file);
      const extension = mimeType ? MIME_TO_EXTENSION[mimeType] : null;
      const isSupportedVideo =
        mimeType === "video/quicktime" ||
        mimeType === "video/mp4" ||
        mimeType === "video/webm";

      if (validationError || !isSupportedVideo || !extension) {
        throw new Error(validationError ?? "Unsupported video type.");
      }

      const id = crypto.randomUUID();
      const storagePath = `${userId}/${momentId}/${id}.${extension}`;
      const { error: uploadError } = await bucket.upload(storagePath, file, {
        contentType: mimeType,
        upsert: false,
      });

      if (uploadError) {
        throw new Error(uploadErrorMessage(file.name, uploadError));
      }

      uploadedPaths.push(storagePath);
      completedBytes += file.size;
      onProgress?.(Math.round((completedBytes / totalBytes) * 100));

      let thumbnailPath: string | null = null;
      if (thumbnail) {
        thumbnailPath = thumbnailStoragePath(storagePath);
        const { error: thumbnailError } = await bucket.upload(
          thumbnailPath,
          thumbnail,
          { contentType: "image/jpeg", upsert: false },
        );

        if (thumbnailError) {
          throw new Error(uploadErrorMessage(file.name, thumbnailError));
        }

        uploadedPaths.push(thumbnailPath);
        completedBytes += thumbnail.size;
        onProgress?.(Math.round((completedBytes / totalBytes) * 100));
      }

      uploads.push({
        id,
        clientIndex,
        storagePath,
        thumbnailPath,
        mimeType,
        fileSize: file.size,
        originalFilename: file.name,
      });
    }

    onProgress?.(100);
    return uploads;
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await bucket.remove(uploadedPaths);
    }
    throw error;
  }
}
