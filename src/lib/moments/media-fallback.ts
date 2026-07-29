import { MEDIA_BUCKET } from "@/lib/moments/media";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_URL_TTL_SECONDS = 60 * 60;

export async function getMomentPhotoFallbackUrl(
  momentId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data: attachment, error } = await supabase
    .from("media_attachments")
    .select("storage_path")
    .eq("moment_id", momentId)
    .eq("media_type", "photo")
    .order("display_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!attachment?.storage_path) {
    return null;
  }

  const { data, error: signingError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(attachment.storage_path, FALLBACK_URL_TTL_SECONDS);

  if (signingError) {
    throw signingError;
  }

  return data?.signedUrl ?? null;
}

export async function getMomentAttachmentFallbackUrl(
  momentId: string,
  attachmentId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data: attachment, error } = await supabase
    .from("media_attachments")
    .select("storage_path")
    .eq("moment_id", momentId)
    .eq("id", attachmentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!attachment?.storage_path) {
    return null;
  }

  const { data, error: signingError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(attachment.storage_path, FALLBACK_URL_TTL_SECONDS);

  if (signingError) {
    throw signingError;
  }

  return data?.signedUrl ?? null;
}
