import type { SupabaseClient } from "@supabase/supabase-js";

import {
  extensionFromFile,
  getMediaTypeFromMime,
  MEDIA_BUCKET,
  validateMediaFile,
} from "@/lib/moments/media";
import { createPhotoThumbnailBuffer } from "@/lib/moments/thumbnail-image";
import {
  shouldGenerateThumbnail,
  thumbnailStoragePath,
} from "@/lib/moments/thumbnails";

type StorageSupabase = SupabaseClient;

export async function removeMediaAttachmentsForMoment(
  supabase: StorageSupabase,
  momentId: string,
): Promise<void> {
  const { data: attachments, error } = await supabase
    .from("media_attachments")
    .select("id, storage_path, thumbnail_path")
    .eq("moment_id", momentId);

  if (error) {
    throw error;
  }

  if (!attachments?.length) {
    return;
  }

  const paths = attachments.flatMap((attachment) => {
    const list = [attachment.storage_path];
    if (attachment.thumbnail_path) {
      list.push(attachment.thumbnail_path);
    }
    return list;
  });

  const { error: storageError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove(paths);

  if (storageError) {
    throw storageError;
  }

  const { error: deleteError } = await supabase
    .from("media_attachments")
    .delete()
    .eq("moment_id", momentId);

  if (deleteError) {
    throw deleteError;
  }
}

async function uploadPhotoThumbnail(
  supabase: StorageSupabase,
  file: File,
  storagePath: string,
): Promise<string | null> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const thumbnail = await createPhotoThumbnailBuffer(bytes);

  if (!thumbnail) {
    return null;
  }

  const thumbPath = thumbnailStoragePath(storagePath);
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(thumbPath, thumbnail, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    return null;
  }

  return thumbPath;
}

export async function uploadMediaForMoment(
  supabase: StorageSupabase,
  userId: string,
  momentId: string,
  file: File,
): Promise<void> {
  const validationError = validateMediaFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const mediaType = getMediaTypeFromMime(file.type);

  if (!mediaType) {
    throw new Error("Unsupported file type.");
  }

  const attachmentId = crypto.randomUUID();
  const extension = extensionFromFile(file);
  const storagePath = `${userId}/${momentId}/${attachmentId}.${extension}`;
  const uploadedPaths = [storagePath];

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  let thumbnailPath: string | null = null;

  if (shouldGenerateThumbnail(mediaType, file.type)) {
    thumbnailPath = await uploadPhotoThumbnail(supabase, file, storagePath);
    if (thumbnailPath) {
      uploadedPaths.push(thumbnailPath);
    }
  }

  const { error: insertError } = await supabase
    .from("media_attachments")
    .insert({
      id: attachmentId,
      moment_id: momentId,
      user_id: userId,
      media_type: mediaType,
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
      mime_type: file.type,
      file_size_bytes: file.size,
      original_filename: file.name,
    });

  if (insertError) {
    await supabase.storage.from(MEDIA_BUCKET).remove(uploadedPaths);
    throw insertError;
  }
}

export async function replaceMediaForMoment(
  supabase: StorageSupabase,
  userId: string,
  momentId: string,
  file: File,
): Promise<void> {
  await removeMediaAttachmentsForMoment(supabase, momentId);
  await uploadMediaForMoment(supabase, userId, momentId, file);
}
