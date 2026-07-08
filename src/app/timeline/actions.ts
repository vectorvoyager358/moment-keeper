"use server";

import { toUserErrorMessage } from "@/lib/errors";
import {
  getTimelineMoments,
  type TimelineMoment,
  type TimelinePageResult,
} from "@/lib/moments/queries";
import type { TimelineSearchFilters } from "@/lib/moments/search";

export type LoadMoreTimelineState = TimelinePageResult<TimelineMoment> & {
  error?: string;
};

export async function loadMoreTimelineMoments(
  filters: TimelineSearchFilters,
  offset: number,
): Promise<LoadMoreTimelineState> {
  try {
    return await getTimelineMoments(filters, { offset });
  } catch (error) {
    return {
      items: [],
      hasMore: false,
      error: toUserErrorMessage(error),
    };
  }
}
