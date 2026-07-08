import type { SupabaseClient } from "@supabase/supabase-js";

import {
  extensionFromFile,
  getMediaTypeFromMime,
  MEDIA_BUCKET,
  validateMediaFile,
} from "@/lib/moments/media";

type StorageSupabase = SupabaseClient;

export async function removeMediaAttachmentsForMoment(
  supabase: StorageSupabase,
  momentId: string,
): Promise<void> {
  const { data: attachments, error } = await supabase
    .from("media_attachments")
    .select("id, storage_path")
    .eq("moment_id", momentId);

  if (error) {
    throw error;
  }

  if (!attachments?.length) {
    return;
  }

  const paths = attachments.map((attachment) => attachment.storage_path);
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

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { error: insertError } = await supabase
    .from("media_attachments")
    .insert({
      id: attachmentId,
      moment_id: momentId,
      user_id: userId,
      media_type: mediaType,
      storage_path: storagePath,
      mime_type: file.type,
      file_size_bytes: file.size,
      original_filename: file.name,
    });

  if (insertError) {
    await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
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
