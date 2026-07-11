import { revalidatePath } from "next/cache";

import { toUserErrorMessage } from "@/lib/errors";
import { validateOccurredAt } from "@/lib/moments/dates";
import {
  getMediaFileFromFormData,
  shouldRemoveMedia,
  validateMediaFile,
} from "@/lib/moments/media";
import {
  removeMediaAttachmentsForMoment,
  replaceMediaForMoment,
  uploadMediaForMoment,
} from "@/lib/moments/media-storage";
import {
  findOrCreateTagIds,
  linkMomentTags,
  replaceMomentTags,
} from "@/lib/moments/repository";
import { parseTagInput } from "@/lib/moments/tags";
import { parseMemoryThemeFormData } from "@/lib/moments/themes";
import { validateMomentBody } from "@/lib/moments/validation";
import { createClient } from "@/lib/supabase/server";

export type SaveMomentResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string; status?: number };

export async function saveNewMoment(
  formData: FormData,
): Promise<SaveMomentResult> {
  const body = String(formData.get("body") ?? "");
  const occurredAtRaw = String(formData.get("occurred_at") ?? "");
  const tagsRaw = String(formData.get("tags") ?? "");
  const themeInput = parseMemoryThemeFormData(formData);
  const mediaFile = getMediaFileFromFormData(formData);

  if (themeInput.error) {
    return { ok: false, error: themeInput.error, status: 400 };
  }

  const bodyError = validateMomentBody(body);
  if (bodyError) {
    return { ok: false, error: bodyError, status: 400 };
  }

  const occurredAtError = validateOccurredAt(occurredAtRaw);
  if (occurredAtError) {
    return { ok: false, error: occurredAtError, status: 400 };
  }

  if (mediaFile) {
    const mediaError = validateMediaFile(mediaFile);
    if (mediaError) {
      return { ok: false, error: mediaError, status: 400 };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: "You must be logged in to save a moment.",
      status: 401,
    };
  }

  const occurredAt = new Date(occurredAtRaw).toISOString();

  const { data: moment, error: momentError } = await supabase
    .from("moments")
    .insert({
      user_id: user.id,
      body: body.trim(),
      themes: themeInput.themes,
      occurred_at: occurredAt,
    })
    .select("id")
    .single();

  if (momentError || !moment) {
    return {
      ok: false,
      error: toUserErrorMessage(momentError, "Could not save your moment."),
      status: 500,
    };
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

    return {
      ok: false,
      error: toUserErrorMessage(error, "Could not save your moment."),
      status: 500,
    };
  }

  revalidatePath("/timeline");
  return { ok: true, redirectTo: "/timeline?saved=1" };
}

export async function saveUpdatedMoment(
  momentId: string,
  formData: FormData,
): Promise<SaveMomentResult> {
  const body = String(formData.get("body") ?? "");
  const occurredAtRaw = String(formData.get("occurred_at") ?? "");
  const tagsRaw = String(formData.get("tags") ?? "");
  const themeInput = parseMemoryThemeFormData(formData);
  const mediaFile = getMediaFileFromFormData(formData);
  if (themeInput.error) {
    return { ok: false, error: themeInput.error, status: 400 };
  }

  const removeMedia = shouldRemoveMedia(formData);

  const bodyError = validateMomentBody(body);
  if (bodyError) {
    return { ok: false, error: bodyError, status: 400 };
  }

  const occurredAtError = validateOccurredAt(occurredAtRaw);
  if (occurredAtError) {
    return { ok: false, error: occurredAtError, status: 400 };
  }

  if (mediaFile) {
    const mediaError = validateMediaFile(mediaFile);
    if (mediaError) {
      return { ok: false, error: mediaError, status: 400 };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: "You must be logged in to edit a moment.",
      status: 401,
    };
  }

  const occurredAt = new Date(occurredAtRaw).toISOString();

  const { error: updateError } = await supabase
    .from("moments")
    .update({
      body: body.trim(),
      themes: themeInput.themes,
      occurred_at: occurredAt,
    })
    .eq("id", momentId);

  if (updateError) {
    return {
      ok: false,
      error: toUserErrorMessage(updateError, "Could not update your moment."),
      status: 500,
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
      ok: false,
      error: toUserErrorMessage(error, "Could not update your moment."),
      status: 500,
    };
  }

  revalidatePath("/timeline");
  revalidatePath(`/moments/${momentId}`);
  return { ok: true, redirectTo: `/moments/${momentId}` };
}
