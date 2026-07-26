"use server";

import { toUserErrorMessage } from "@/lib/errors";
import {
  getOnThisDayMoments,
  getResurfacedMoments,
  getTimelineMoments,
  getUserTags,
  type TimelineMoment,
  type TimelinePageResult,
  type TimelinePagination,
  type UserTag,
} from "@/lib/moments/queries";
import type { TimelineSearchFilters } from "@/lib/moments/search";
import type { ResurfacingFilters } from "@/lib/moments/themes";
import { getRequestTimeZone } from "@/lib/timezone.server";

export type LoadMoreTimelineState = TimelinePageResult<TimelineMoment> & {
  error?: string;
};

export async function loadMoreTimelineMoments(
  filters: TimelineSearchFilters,
  pagination: TimelinePagination,
): Promise<LoadMoreTimelineState> {
  try {
    return await getTimelineMoments(filters, pagination);
  } catch (error) {
    return {
      items: [],
      hasMore: false,
      error: toUserErrorMessage(error),
    };
  }
}

export async function loadTimelineTags(): Promise<{
  tags: UserTag[];
  error?: string;
}> {
  try {
    return { tags: await getUserTags() };
  } catch (error) {
    return {
      tags: [],
      error: toUserErrorMessage(error, "Could not load your tags."),
    };
  }
}

export async function loadOnThisDayTimeline(): Promise<{
  moments: TimelineMoment[];
  todayIso: string;
  timeZone: string;
  error?: string;
}> {
  const today = new Date();
  const timeZone = await getRequestTimeZone();

  try {
    return {
      moments: await getOnThisDayMoments(today, timeZone),
      todayIso: today.toISOString(),
      timeZone,
    };
  } catch (error) {
    return {
      moments: [],
      todayIso: today.toISOString(),
      timeZone,
      error: toUserErrorMessage(error, "Could not load on-this-day memories."),
    };
  }
}

export async function loadResurfacedTimeline(
  filters: ResurfacingFilters,
): Promise<{ moments: TimelineMoment[]; error?: string }> {
  try {
    return {
      moments: await getResurfacedMoments(filters.themes, filters.mediaType),
    };
  } catch (error) {
    return {
      moments: [],
      error: toUserErrorMessage(error, "Could not find memories for you."),
    };
  }
}
