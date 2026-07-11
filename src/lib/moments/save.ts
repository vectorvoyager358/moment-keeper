import { revalidatePath } from "next/cache";

import { toUserErrorMessage } from "@/lib/errors";
import {
  parseOccurredAtFormValue,
  parseTimezoneOffsetFromFormData,
  validateOccurredAt,
} from "@/lib/moments/dates";
import {
  getMediaFilesFromFormData,
  getRemovedMediaIds,
  MAX_MEDIA_ATTACHMENTS,
  validateMediaFiles,
} from "@/lib/moments/media";
import {
  removeMediaAttachmentsById,
  uploadMediaFilesForMoment,
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

function parseFavoriteFormData(formData: FormData): boolean {
  return formData.get("favorite") === "1";
}

export async function saveNewMoment(
  formData: FormData,
): Promise<SaveMomentResult> {
  const body = String(formData.get("body") ?? "");
  const occurredAtRaw = String(formData.get("occurred_at") ?? "");
  const tagsRaw = String(formData.get("tags") ?? "");
  const themeInput = parseMemoryThemeFormData(formData);
  const mediaFiles = getMediaFilesFromFormData(formData);

  if (themeInput.error) {
    return { ok: false, error: themeInput.error, status: 400 };
  }

  const bodyError = validateMomentBody(body);
  if (bodyError) {
    return { ok: false, error: bodyError, status: 400 };
  }

  const timezoneOffset = parseTimezoneOffsetFromFormData(formData);
  const occurredAtError = validateOccurredAt(occurredAtRaw, timezoneOffset);
  if (occurredAtError) {
    return { ok: false, error: occurredAtError, status: 400 };
  }

  const mediaError = validateMediaFiles(mediaFiles);
  if (mediaError) {
    return { ok: false, error: mediaError, status: 400 };
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

  const occurredAt = parseOccurredAtFormValue(occurredAtRaw, timezoneOffset);

  const { data: moment, error: momentError } = await supabase
    .from("moments")
    .insert({
      user_id: user.id,
      body: body.trim(),
      themes: themeInput.themes,
      occurred_at: occurredAt,
      is_favorite: parseFavoriteFormData(formData),
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

    if (mediaFiles.length > 0) {
      await uploadMediaFilesForMoment(supabase, user.id, moment.id, mediaFiles);
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
  const mediaFiles = getMediaFilesFromFormData(formData);
  const removedMediaIds = getRemovedMediaIds(formData);
  if (themeInput.error) {
    return { ok: false, error: themeInput.error, status: 400 };
  }

  const bodyError = validateMomentBody(body);
  if (bodyError) {
    return { ok: false, error: bodyError, status: 400 };
  }

  const timezoneOffset = parseTimezoneOffsetFromFormData(formData);
  const occurredAtError = validateOccurredAt(occurredAtRaw, timezoneOffset);
  if (occurredAtError) {
    return { ok: false, error: occurredAtError, status: 400 };
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

  const { data: existingMedia, error: existingMediaError } = await supabase
    .from("media_attachments")
    .select("id, display_order")
    .eq("moment_id", momentId)
    .order("display_order", { ascending: true });

  if (existingMediaError) {
    return {
      ok: false,
      error: toUserErrorMessage(
        existingMediaError,
        "Could not load this moment's media.",
      ),
      status: 500,
    };
  }

  const existingIds = new Set(
    (existingMedia ?? []).map((attachment) => attachment.id),
  );
  const validRemovedIds = removedMediaIds.filter((id) => existingIds.has(id));
  const remainingMedia = (existingMedia ?? []).filter(
    (attachment) => !validRemovedIds.includes(attachment.id),
  );
  const mediaError = validateMediaFiles(mediaFiles, remainingMedia.length);

  if (mediaError) {
    return { ok: false, error: mediaError, status: 400 };
  }

  const occurredAt = parseOccurredAtFormValue(occurredAtRaw, timezoneOffset);

  const { error: updateError } = await supabase
    .from("moments")
    .update({
      body: body.trim(),
      themes: themeInput.themes,
      occurred_at: occurredAt,
      is_favorite: parseFavoriteFormData(formData),
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

    if (validRemovedIds.length > 0) {
      await removeMediaAttachmentsById(supabase, momentId, validRemovedIds);
    }

    if (mediaFiles.length > 0) {
      const occupiedOrders = new Set(
        remainingMedia.map((attachment) => attachment.display_order),
      );
      const availableOrders = Array.from(
        { length: MAX_MEDIA_ATTACHMENTS },
        (_, index) => index,
      ).filter((order) => !occupiedOrders.has(order));

      await uploadMediaFilesForMoment(
        supabase,
        user.id,
        momentId,
        mediaFiles,
        0,
        availableOrders,
      );
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
  return { ok: true, redirectTo: `/moments/${momentId}?updated=1` };
}
