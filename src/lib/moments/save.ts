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
  MAX_TOTAL_MEDIA_BYTES,
  parseMediaThumbnailsFromFormData,
  validateMediaFiles,
} from "@/lib/moments/media";
import {
  isUuid,
  parseDirectUploadedMedia,
  parseMediaClientIndexes,
  validateCombinedMediaIndexes,
  validateDirectUploadedMedia,
} from "@/lib/moments/direct-upload";
import {
  registerDirectUploadedMedia,
  removeDirectUploadedMedia,
  removeMediaAttachmentsById,
  reorderMediaAttachments,
  uploadMediaFilesForMoment,
} from "@/lib/moments/media-storage";
import {
  findOrCreateTagIds,
  linkMomentTags,
  replaceMomentTags,
} from "@/lib/moments/repository";
import { parseTagInput } from "@/lib/moments/tags";
import { parseMemoryThemeFormData } from "@/lib/moments/themes";
import {
  parseLocationFormData,
  validateMomentLocation,
} from "@/lib/moments/location";
import { parseMomentLinkFormData } from "@/lib/moments/link";
import { parseRichTextFormData } from "@/lib/moments/rich-text";
import { validateMomentBody } from "@/lib/moments/validation";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

export type SaveMomentResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string; status?: number };

function parseFavoriteFormData(formData: FormData): boolean {
  return formData.get("favorite") === "1";
}

function getRequestedMediaOrder(formData: FormData): string[] {
  return formData
    .getAll("media_order")
    .map(String)
    .filter((token) => token.length > 0);
}

function resolveMediaOrder(
  requestedOrder: string[],
  existingMediaIds: string[],
  newMediaIds: string[],
): string[] {
  const tokenToId = new Map<string, string>();
  existingMediaIds.forEach((id) => tokenToId.set(`existing:${id}`, id));
  newMediaIds.forEach((id, index) => tokenToId.set(`new:${index}`, id));

  const orderedIds: string[] = [];
  const seenIds = new Set<string>();

  for (const token of requestedOrder) {
    const id = tokenToId.get(token);
    if (id && !seenIds.has(id)) {
      seenIds.add(id);
      orderedIds.push(id);
    }
  }

  for (const id of [...existingMediaIds, ...newMediaIds]) {
    if (!seenIds.has(id)) {
      seenIds.add(id);
      orderedIds.push(id);
    }
  }

  return orderedIds;
}

export async function saveNewMoment(
  formData: FormData,
): Promise<SaveMomentResult> {
  const richTextInput = parseRichTextFormData(formData);
  const body = richTextInput.body;
  const occurredAtRaw = String(formData.get("occurred_at") ?? "");
  const tagsRaw = String(formData.get("tags") ?? "");
  const themeInput = parseMemoryThemeFormData(formData);
  const mediaFiles = getMediaFilesFromFormData(formData);
  const mediaThumbnailInput = parseMediaThumbnailsFromFormData(
    formData,
    mediaFiles.length,
  );
  const directMediaInput = parseDirectUploadedMedia(formData);
  const mediaClientIndexInput = parseMediaClientIndexes(
    formData,
    mediaFiles.length,
  );
  const linkInput = parseMomentLinkFormData(formData);

  if (richTextInput.error) {
    return { ok: false, error: richTextInput.error, status: 400 };
  }

  if (themeInput.error) {
    return { ok: false, error: themeInput.error, status: 400 };
  }

  if (linkInput.error) {
    return { ok: false, error: linkInput.error, status: 400 };
  }

  if (mediaThumbnailInput.error) {
    return { ok: false, error: mediaThumbnailInput.error, status: 400 };
  }

  if (directMediaInput.error) {
    return { ok: false, error: directMediaInput.error, status: 400 };
  }

  if (mediaClientIndexInput.error) {
    return { ok: false, error: mediaClientIndexInput.error, status: 400 };
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

  const mediaError = validateMediaFiles(
    mediaFiles,
    directMediaInput.uploads.length,
  );
  if (mediaError) {
    return { ok: false, error: mediaError, status: 400 };
  }

  const combinedMediaBytes =
    mediaFiles.reduce((total, file) => total + file.size, 0) +
    directMediaInput.uploads.reduce(
      (total, upload) => total + upload.fileSize,
      0,
    );
  if (combinedMediaBytes > MAX_TOTAL_MEDIA_BYTES) {
    return {
      ok: false,
      error: "Combined media upload must be 50 MB or less.",
      status: 400,
    };
  }

  const location = parseLocationFormData(formData);
  const locationError = validateMomentLocation(location);
  if (locationError) {
    return { ok: false, error: locationError, status: 400 };
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

  const requestedMomentId = String(formData.get("moment_id") ?? "");
  if (requestedMomentId && !isUuid(requestedMomentId)) {
    return { ok: false, error: "Invalid moment data.", status: 400 };
  }

  if (directMediaInput.uploads.length > 0 && !requestedMomentId) {
    return { ok: false, error: "Invalid uploaded media data.", status: 400 };
  }

  const directMediaError = validateDirectUploadedMedia(
    directMediaInput.uploads,
    user.id,
    requestedMomentId,
  );
  if (directMediaError) {
    return { ok: false, error: directMediaError, status: 400 };
  }

  const combinedIndexError = validateCombinedMediaIndexes(
    mediaClientIndexInput.indexes,
    directMediaInput.uploads,
  );
  if (combinedIndexError) {
    return { ok: false, error: combinedIndexError, status: 400 };
  }

  const occurredAt = parseOccurredAtFormValue(occurredAtRaw, timezoneOffset);

  const { data: moment, error: momentError } = await supabase
    .from("moments")
    .insert({
      ...(requestedMomentId ? { id: requestedMomentId } : {}),
      user_id: user.id,
      body,
      body_content: richTextInput.content as unknown as Json,
      themes: themeInput.themes,
      occurred_at: occurredAt,
      is_favorite: parseFavoriteFormData(formData),
      location,
      link_url: linkInput.url,
    })
    .select("id")
    .single();

  if (momentError || !moment) {
    await removeDirectUploadedMedia(supabase, directMediaInput.uploads);
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

    if (directMediaInput.uploads.length > 0) {
      await registerDirectUploadedMedia(
        supabase,
        user.id,
        moment.id,
        directMediaInput.uploads,
      );
    }

    if (mediaFiles.length > 0) {
      const hasExplicitMediaIndexes =
        formData.getAll("media_client_index").length > 0;
      if (mediaThumbnailInput.thumbnails.some(Boolean)) {
        await uploadMediaFilesForMoment(
          supabase,
          user.id,
          moment.id,
          mediaFiles,
          0,
          hasExplicitMediaIndexes ? mediaClientIndexInput.indexes : undefined,
          mediaThumbnailInput.thumbnails,
        );
      } else if (hasExplicitMediaIndexes) {
        await uploadMediaFilesForMoment(
          supabase,
          user.id,
          moment.id,
          mediaFiles,
          0,
          mediaClientIndexInput.indexes,
        );
      } else {
        await uploadMediaFilesForMoment(
          supabase,
          user.id,
          moment.id,
          mediaFiles,
        );
      }
    }
  } catch (error) {
    await removeDirectUploadedMedia(supabase, directMediaInput.uploads);
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
  const richTextInput = parseRichTextFormData(formData);
  const body = richTextInput.body;
  const occurredAtRaw = String(formData.get("occurred_at") ?? "");
  const tagsRaw = String(formData.get("tags") ?? "");
  const themeInput = parseMemoryThemeFormData(formData);
  const mediaFiles = getMediaFilesFromFormData(formData);
  const mediaThumbnailInput = parseMediaThumbnailsFromFormData(
    formData,
    mediaFiles.length,
  );
  const removedMediaIds = getRemovedMediaIds(formData);
  const requestedMediaOrder = getRequestedMediaOrder(formData);
  const linkInput = parseMomentLinkFormData(formData);
  if (richTextInput.error) {
    return { ok: false, error: richTextInput.error, status: 400 };
  }

  if (themeInput.error) {
    return { ok: false, error: themeInput.error, status: 400 };
  }

  if (linkInput.error) {
    return { ok: false, error: linkInput.error, status: 400 };
  }

  if (mediaThumbnailInput.error) {
    return { ok: false, error: mediaThumbnailInput.error, status: 400 };
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

  const location = parseLocationFormData(formData);
  const locationError = validateMomentLocation(location);
  if (locationError) {
    return { ok: false, error: locationError, status: 400 };
  }

  const occurredAt = parseOccurredAtFormValue(occurredAtRaw, timezoneOffset);

  const { error: updateError } = await supabase
    .from("moments")
    .update({
      body,
      body_content: richTextInput.content as unknown as Json,
      themes: themeInput.themes,
      occurred_at: occurredAt,
      is_favorite: parseFavoriteFormData(formData),
      location,
      link_url: linkInput.url,
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

    let uploadedMediaIds: string[] = [];
    if (mediaFiles.length > 0) {
      const occupiedOrders = new Set(
        remainingMedia.map((attachment) => attachment.display_order),
      );
      const availableOrders = Array.from(
        { length: MAX_MEDIA_ATTACHMENTS },
        (_, index) => index,
      ).filter((order) => !occupiedOrders.has(order));

      if (mediaThumbnailInput.thumbnails.some(Boolean)) {
        uploadedMediaIds = await uploadMediaFilesForMoment(
          supabase,
          user.id,
          momentId,
          mediaFiles,
          0,
          availableOrders,
          mediaThumbnailInput.thumbnails,
        );
      } else {
        uploadedMediaIds = await uploadMediaFilesForMoment(
          supabase,
          user.id,
          momentId,
          mediaFiles,
          0,
          availableOrders,
        );
      }
    }

    if (requestedMediaOrder.length > 0) {
      const finalMediaOrder = resolveMediaOrder(
        requestedMediaOrder,
        remainingMedia.map((attachment) => attachment.id),
        uploadedMediaIds,
      );
      await reorderMediaAttachments(supabase, momentId, finalMediaOrder);
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
