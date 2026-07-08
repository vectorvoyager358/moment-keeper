"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { toUserErrorMessage } from "@/lib/errors";
import { validateOccurredAt } from "@/lib/moments/dates";
import {
  getMediaFileFromFormData,
  shouldRemoveMedia,
} from "@/lib/moments/media";
import {
  removeMediaAttachmentsForMoment,
  replaceMediaForMoment,
} from "@/lib/moments/media-storage";
import { replaceMomentTags } from "@/lib/moments/repository";
import { parseTagInput } from "@/lib/moments/tags";
import type { CaptureFormState } from "@/lib/moments/types";
import { validateMomentBody } from "@/lib/moments/validation";
import { createClient } from "@/lib/supabase/server";

export async function updateMoment(
  momentId: string,
  _prevState: CaptureFormState,
  formData: FormData,
): Promise<CaptureFormState> {
  const body = String(formData.get("body") ?? "");
  const occurredAtRaw = String(formData.get("occurred_at") ?? "");
  const tagsRaw = String(formData.get("tags") ?? "");
  const mediaFile = getMediaFileFromFormData(formData);
  const removeMedia = shouldRemoveMedia(formData);

  const bodyError = validateMomentBody(body);
  if (bodyError) {
    return { error: bodyError };
  }

  const occurredAtError = validateOccurredAt(occurredAtRaw);
  if (occurredAtError) {
    return { error: occurredAtError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to edit a moment." };
  }

  const occurredAt = new Date(occurredAtRaw).toISOString();

  const { error: updateError } = await supabase
    .from("moments")
    .update({
      body: body.trim(),
      occurred_at: occurredAt,
    })
    .eq("id", momentId);

  if (updateError) {
    return {
      error: toUserErrorMessage(updateError, "Could not update your moment."),
    };
  }

  try {
    await replaceMomentTags(
      supabase,
      user.id,
      momentId,
      parseTagInput(tagsRaw),
    );

    if (removeMedia) {
      await removeMediaAttachmentsForMoment(supabase, momentId);
    } else if (mediaFile) {
      await replaceMediaForMoment(supabase, user.id, momentId, mediaFile);
    }
  } catch (error) {
    return {
      error: toUserErrorMessage(error, "Could not update your moment."),
    };
  }

  revalidatePath("/timeline");
  revalidatePath(`/moments/${momentId}`);
  redirect(`/moments/${momentId}`);
}

export async function deleteMoment(momentId: string): Promise<void> {
  const supabase = await createClient();

  try {
    await removeMediaAttachmentsForMoment(supabase, momentId);
  } catch (error) {
    throw new Error(
      toUserErrorMessage(error, "Could not delete moment media."),
    );
  }

  const { error } = await supabase.from("moments").delete().eq("id", momentId);

  if (error) {
    throw new Error(toUserErrorMessage(error, "Could not delete this moment."));
  }

  revalidatePath("/timeline");
  redirect("/timeline");
}
