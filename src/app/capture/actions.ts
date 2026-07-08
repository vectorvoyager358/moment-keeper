"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { validateOccurredAt } from "@/lib/moments/dates";
import { getMediaFileFromFormData } from "@/lib/moments/media";
import { uploadMediaForMoment } from "@/lib/moments/media-storage";
import { findOrCreateTagIds, linkMomentTags } from "@/lib/moments/repository";
import { parseTagInput } from "@/lib/moments/tags";
import type { CaptureFormState } from "@/lib/moments/types";
import { validateMomentBody } from "@/lib/moments/validation";
import { createClient } from "@/lib/supabase/server";

export async function createMoment(
  _prevState: CaptureFormState,
  formData: FormData,
): Promise<CaptureFormState> {
  const body = String(formData.get("body") ?? "");
  const occurredAtRaw = String(formData.get("occurred_at") ?? "");
  const tagsRaw = String(formData.get("tags") ?? "");
  const mediaFile = getMediaFileFromFormData(formData);

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
    return { error: "You must be logged in to save a moment." };
  }

  const occurredAt = new Date(occurredAtRaw).toISOString();

  const { data: moment, error: momentError } = await supabase
    .from("moments")
    .insert({
      user_id: user.id,
      body: body.trim(),
      occurred_at: occurredAt,
    })
    .select("id")
    .single();

  if (momentError || !moment) {
    return { error: momentError?.message ?? "Could not save your moment." };
  }

  try {
    const tagNames = parseTagInput(tagsRaw);
    const tagIds = await findOrCreateTagIds(supabase, user.id, tagNames);
    await linkMomentTags(supabase, moment.id, tagIds);

    if (mediaFile) {
      await uploadMediaForMoment(supabase, user.id, moment.id, mediaFile);
    }
  } catch (error) {
    await supabase.from("moments").delete().eq("id", moment.id);

    const message =
      error instanceof Error ? error.message : "Could not save your moment.";

    return { error: message };
  }

  revalidatePath("/timeline");
  redirect("/timeline");
}
