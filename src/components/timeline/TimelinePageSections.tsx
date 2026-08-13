import { TimelineFeed } from "@/components/timeline/TimelineFeed";
import { TimelineSearchEmptyState } from "@/components/timeline/TimelineSearchForm";
import { toUserErrorMessage } from "@/lib/errors";
import {
  getTimelineMoments,
  type TimelineMoment,
  type TimelinePageResult,
} from "@/lib/moments/queries";
import {
  hasActiveSearchFilters,
  type TimelineSearchFilters,
} from "@/lib/moments/search";

export async function TimelineResults({
  filters,
  timelinePromise,
}: {
  filters: TimelineSearchFilters;
  timelinePromise?: Promise<TimelinePageResult<TimelineMoment>>;
}) {
  let timelinePage;

  try {
    timelinePage = await (timelinePromise ?? getTimelineMoments(filters));
  } catch (error) {
    throw new Error(toUserErrorMessage(error, "Could not load your timeline."));
  }

  const isSearching = hasActiveSearchFilters(filters);

  if (timelinePage.items.length === 0 && isSearching) {
    return <TimelineSearchEmptyState />;
  }

  return (
    <TimelineFeed
      key={`${filters.keyword}:${filters.tagIds.join(",")}:${filters.favoriteOnly}`}
      initialMoments={timelinePage.items}
      initialHasMore={timelinePage.hasMore}
      initialNextCursor={timelinePage.nextCursor ?? null}
      filters={filters}
    />
  );
}
