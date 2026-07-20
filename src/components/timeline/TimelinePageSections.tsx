import { TimelineEmptyState } from "@/components/timeline/MomentCard";
import { TimelineFeed } from "@/components/timeline/TimelineFeed";
import {
  TimelineSearchEmptyState,
  TimelineSearchForm,
} from "@/components/timeline/TimelineSearchForm";
import { toUserErrorMessage } from "@/lib/errors";
import { getTimelineMoments, getUserTags } from "@/lib/moments/queries";
import {
  hasActiveSearchFilters,
  type TimelineSearchFilters,
} from "@/lib/moments/search";

export async function TimelineSearchSection({
  filters,
}: {
  filters: TimelineSearchFilters;
}) {
  let tags;

  try {
    tags = await getUserTags();
  } catch (error) {
    throw new Error(toUserErrorMessage(error, "Could not load your tags."));
  }

  return <TimelineSearchForm filters={filters} tags={tags} />;
}

export async function TimelineResults({
  filters,
}: {
  filters: TimelineSearchFilters;
}) {
  let timelinePage;

  try {
    timelinePage = await getTimelineMoments(filters);
  } catch (error) {
    throw new Error(toUserErrorMessage(error, "Could not load your timeline."));
  }

  const isSearching = hasActiveSearchFilters(filters);

  if (timelinePage.items.length === 0) {
    return isSearching ? <TimelineSearchEmptyState /> : <TimelineEmptyState />;
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
