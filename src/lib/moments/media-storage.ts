import type { SupabaseClient } from "@supabase/supabase-js";

import {
  extensionFromFile,
  getMediaTypeFromFile,
  getNormalizedMediaMimeType,
  MEDIA_BUCKET,
  validateMediaFile,
} from "@/lib/moments/media";
import { createPhotoThumbnailBuffer } from "@/lib/moments/thumbnail-image";
import {
  shouldGenerateThumbnail,
  thumbnailStoragePath,
} from "@/lib/moments/thumbnails";

type StorageSupabase = SupabaseClient;

type UploadedAttachment = {
  id: string;
  paths: string[];
};

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
  displayOrder = 0,
): Promise<UploadedAttachment> {
  const validationError = validateMediaFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const mediaType = getMediaTypeFromFile(file);
  const normalizedMimeType = getNormalizedMediaMimeType(file);

  if (!mediaType || !normalizedMimeType) {
    throw new Error("Unsupported file type.");
  }

  const attachmentId = crypto.randomUUID();
  const extension = extensionFromFile(file);
  const storagePath = `${userId}/${momentId}/${attachmentId}.${extension}`;
  const uploadedPaths = [storagePath];

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, file, {
      contentType: normalizedMimeType,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  let thumbnailPath: string | null = null;

  if (shouldGenerateThumbnail(mediaType, normalizedMimeType)) {
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
      display_order: displayOrder,
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
      mime_type: normalizedMimeType,
      file_size_bytes: file.size,
      original_filename: file.name,
    });

  if (insertError) {
    await supabase.storage.from(MEDIA_BUCKET).remove(uploadedPaths);
    throw insertError;
  }

  return { id: attachmentId, paths: uploadedPaths };
}

export async function uploadMediaFilesForMoment(
  supabase: StorageSupabase,
  userId: string,
  momentId: string,
  files: File[],
  startOrder = 0,
  displayOrders?: number[],
): Promise<string[]> {
  const uploaded: UploadedAttachment[] = [];

  try {
    for (const [index, file] of files.entries()) {
      uploaded.push(
        await uploadMediaForMoment(
          supabase,
          userId,
          momentId,
          file,
          displayOrders?.[index] ?? startOrder + index,
        ),
      );
    }
  } catch (error) {
    if (uploaded.length > 0) {
      await supabase.storage
        .from(MEDIA_BUCKET)
        .remove(uploaded.flatMap((attachment) => attachment.paths));
      await supabase
        .from("media_attachments")
        .delete()
        .in(
          "id",
          uploaded.map((attachment) => attachment.id),
        );
    }

    throw error;
  }

  return uploaded.map((attachment) => attachment.id);
}

export async function reorderMediaAttachments(
  supabase: StorageSupabase,
  momentId: string,
  attachmentIds: string[],
): Promise<void> {
  if (attachmentIds.length === 0) {
    return;
  }

  const { error } = await supabase.rpc("reorder_moment_media", {
    p_moment_id: momentId,
    p_attachment_ids: attachmentIds,
  });

  if (error) {
    throw error;
  }
}

export async function removeMediaAttachmentsById(
  supabase: StorageSupabase,
  momentId: string,
  attachmentIds: string[],
): Promise<void> {
  if (attachmentIds.length === 0) {
    return;
  }

  const { data: attachments, error } = await supabase
    .from("media_attachments")
    .select("id, storage_path, thumbnail_path")
    .eq("moment_id", momentId)
    .in("id", attachmentIds);

  if (error) {
    throw error;
  }

  if (!attachments?.length) {
    return;
  }

  const paths = attachments.flatMap((attachment) =>
    attachment.thumbnail_path
      ? [attachment.storage_path, attachment.thumbnail_path]
      : [attachment.storage_path],
  );
  const { error: storageError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove(paths);

  if (storageError) {
    throw storageError;
  }

  const { error: deleteError } = await supabase
    .from("media_attachments")
    .delete()
    .eq("moment_id", momentId)
    .in(
      "id",
      attachments.map((attachment) => attachment.id),
    );

  if (deleteError) {
    throw deleteError;
  }
}
