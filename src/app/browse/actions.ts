"use server";

import { toUserErrorMessage } from "@/lib/errors";
import type { MediaType } from "@/lib/database.types";
import {
  getCalendarMoments,
  getMediaGalleryMoments,
  type MediaGalleryItem,
  type TimelineMoment,
} from "@/lib/moments/queries";

export async function loadBrowseGallery(
  mediaType: MediaType | null,
): Promise<{ items: MediaGalleryItem[]; error?: string }> {
  try {
    return { items: await getMediaGalleryMoments(mediaType) };
  } catch (error) {
    return {
      items: [],
      error: toUserErrorMessage(error, "Could not load your media gallery."),
    };
  }
}

export async function loadBrowseCalendar(
  year: number,
  month: number,
): Promise<{ moments: TimelineMoment[]; error?: string }> {
  try {
    return { moments: await getCalendarMoments(year, month) };
  } catch (error) {
    return {
      moments: [],
      error: toUserErrorMessage(error, "Could not load your calendar."),
    };
  }
}
