"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { toUserErrorMessage } from "@/lib/errors";
import {
  MOMENT_DELETE_REQUEST_GRACE_MS,
  MOMENT_DELETE_STALE_CLEANUP_MS,
  MOMENT_DELETE_UNDO_MS,
} from "@/lib/moments/delete-undo";
import { removeMediaAttachmentsForMoment } from "@/lib/moments/media-storage";
import {
  getTimelineMomentById,
  type TimelineMoment,
} from "@/lib/moments/queries";
import { saveUpdatedMoment } from "@/lib/moments/save";
import type { CaptureFormState } from "@/lib/moments/types";
import { createClient } from "@/lib/supabase/server";

export async function updateMoment(
  momentId: string,
  _prevState: CaptureFormState,
  formData: FormData,
): Promise<CaptureFormState> {
  const result = await saveUpdatedMoment(momentId, formData);

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(result.redirectTo);
}

export async function setMomentFavorite(
  momentId: string,
  isFavorite: boolean,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("moments")
    .update({ is_favorite: isFavorite })
    .eq("id", momentId);

  if (error) {
    return {
      error: toUserErrorMessage(error, "Could not update this favorite."),
    };
  }

  revalidatePath("/timeline");
  revalidatePath("/browse");
  return { error: null };
}

export async function deleteMoment(momentId: string): Promise<void> {
  const supabase = await createClient();
  const deletedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("moments")
    .update({ deleted_at: deletedAt })
    .eq("id", momentId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error(toUserErrorMessage(error, "Could not delete this moment."));
  }

  revalidatePath("/timeline");
  revalidatePath("/browse");
  redirect(`/timeline?deleted=${momentId}`);
}

export async function undoDeleteMoment(momentId: string): Promise<{
  error: string | null;
  restoredMoment?: TimelineMoment | null;
}> {
  const supabase = await createClient();
  const cutoff = new Date(
    Date.now() - MOMENT_DELETE_UNDO_MS - MOMENT_DELETE_REQUEST_GRACE_MS,
  ).toISOString();
  const { data, error } = await supabase
    .from("moments")
    .update({ deleted_at: null })
    .eq("id", momentId)
    .gt("deleted_at", cutoff)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      error: toUserErrorMessage(error, "The undo period has expired."),
    };
  }

  revalidatePath("/timeline");
  revalidatePath("/browse");

  try {
    return {
      error: null,
      restoredMoment: await getTimelineMomentById(momentId),
    };
  } catch {
    return {
      error: "The moment was restored, but it could not be shown yet.",
    };
  }
}

async function permanentlyDeleteMoment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  momentId: string,
  cutoff: string,
): Promise<void> {
  const claimedDeletedAt = new Date(0).toISOString();
  const { data: claimed, error } = await supabase
    .from("moments")
    .update({ deleted_at: claimedDeletedAt })
    .eq("id", momentId)
    .not("deleted_at", "is", null)
    .lte("deleted_at", cutoff)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!claimed) {
    return;
  }

  await removeMediaAttachmentsForMoment(supabase, momentId);

  const { error: deleteError } = await supabase
    .from("moments")
    .delete()
    .eq("id", momentId)
    .eq("deleted_at", claimedDeletedAt);

  if (deleteError) {
    throw new Error(
      toUserErrorMessage(deleteError, "Could not delete this moment."),
    );
  }
}

export async function finalizeDeletedMoment(momentId: string): Promise<void> {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - MOMENT_DELETE_UNDO_MS).toISOString();

  try {
    await permanentlyDeleteMoment(supabase, momentId, cutoff);
  } catch {
    // Keep the hidden row available for the next cleanup attempt.
  }
}

export async function cleanupExpiredDeletedMoments(): Promise<void> {
  const supabase = await createClient();
  const cutoff = new Date(
    Date.now() - MOMENT_DELETE_STALE_CLEANUP_MS,
  ).toISOString();
  const { data } = await supabase
    .from("moments")
    .select("id")
    .not("deleted_at", "is", null)
    .lte("deleted_at", cutoff)
    .limit(20);

  await Promise.allSettled(
    (data ?? []).map((moment) =>
      permanentlyDeleteMoment(supabase, moment.id, cutoff),
    ),
  );
}
