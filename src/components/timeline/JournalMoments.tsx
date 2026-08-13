"use client";

import { useCallback, useEffect, useState } from "react";

import { loadMoreTimelineMoments } from "@/app/timeline/actions";
import {
  DeferredOnThisDayPreview,
  DeferredTimelineRevisit,
  DeferredTimelineSearch,
  TimelineOnThisDayProvider,
} from "@/components/timeline/DeferredTimelinePanels";
import { TimelineFeed } from "@/components/timeline/TimelineFeed";
import { TimelineSearchEmptyState } from "@/components/timeline/TimelineSearchForm";
import { TimelineSurpriseLink } from "@/components/timeline/TimelineSurpriseLink";
import { TimelineTools } from "@/components/timeline/TimelineTools";
import { Alert } from "@/components/ui/Alert";
import { TimelineFeedSkeleton } from "@/components/ui/LoadingSkeleton";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { SavedToast } from "@/components/ui/SavedToast";
import { TIMELINE_INITIAL_PAGE_SIZE } from "@/lib/moments/pagination";
import {
  hasActiveSearchFilters,
  type TimelineSearchFilters,
} from "@/lib/moments/search";
import type { ResurfacingFilters } from "@/lib/moments/themes";
import {
  usePersistViewScroll,
  useRestoreViewScroll,
  useVisibilityRefresh,
} from "@/lib/moments/use-cached-view";
import {
  didTimelineItemsChange,
  getTimelineView,
  invalidateBrowseViews,
  mergeTimelineView,
  removeMomentFromViewCache,
  setTimelineView,
  shouldFetchFreshView,
  timelineViewKey,
  type TimelineViewSnapshot,
} from "@/lib/moments/view-cache";

type JournalMomentsProps = {
  filters: TimelineSearchFilters;
  resurfacingFilters: ResurfacingFilters;
  showSavedToast: boolean;
  showEmptySurprise: boolean;
  deletedMomentId: string | null;
};

export function JournalMoments({
  filters,
  resurfacingFilters,
  showSavedToast,
  showEmptySurprise,
  deletedMomentId,
}: JournalMomentsProps) {
  const cacheKey = timelineViewKey(filters);
  const [snapshot, setSnapshot] = useState<TimelineViewSnapshot | null>(() => {
    if (deletedMomentId) {
      removeMomentFromViewCache(deletedMomentId);
    }

    return getTimelineView(filters);
  });
  const [feedRevision, setFeedRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(!snapshot);

  const applySnapshot = useCallback(
    (next: TimelineViewSnapshot, remountFeed: boolean) => {
      const stored = setTimelineView(filters, next);
      setSnapshot(stored);
      if (remountFeed) {
        setFeedRevision((revision) => revision + 1);
      }
    },
    [filters],
  );

  const applyIncomingPage = useCallback(
    (
      result: Awaited<ReturnType<typeof loadMoreTimelineMoments>>,
      mode: "merge" | "replace",
    ) => {
      if (result.error) {
        setError(result.error);
        setRefreshing(false);
        return;
      }

      setError(null);
      const incoming = {
        items: result.items,
        hasMore: result.hasMore,
        nextCursor: result.nextCursor ?? null,
      };
      const current = getTimelineView(filters);
      const next =
        mode === "merge" && current
          ? mergeTimelineView(current, incoming)
          : incoming;

      applySnapshot(
        {
          ...next,
          updatedAt: Date.now(),
          scrollY: current?.scrollY ?? 0,
        },
        didTimelineItemsChange(current?.items, next.items),
      );
      setRefreshing(false);
    },
    [applySnapshot, filters],
  );

  const refresh = useCallback(
    async (mode: "merge" | "replace") => {
      setRefreshing(true);
      applyIncomingPage(
        await loadMoreTimelineMoments(filters, {
          limit: TIMELINE_INITIAL_PAGE_SIZE,
        }),
        mode,
      );
    },
    [applyIncomingPage, filters],
  );

  useEffect(() => {
    if (showSavedToast || deletedMomentId) {
      invalidateBrowseViews();
    }

    if (
      !shouldFetchFreshView(Boolean(getTimelineView(filters)), showSavedToast)
    ) {
      return;
    }

    const mode = showSavedToast ? "replace" : "merge";
    let active = true;

    void loadMoreTimelineMoments(filters, {
      limit: TIMELINE_INITIAL_PAGE_SIZE,
    }).then((result) => {
      if (active) {
        applyIncomingPage(result, mode);
      }
    });

    return () => {
      active = false;
    };
  }, [applyIncomingPage, deletedMomentId, filters, showSavedToast]);

  const refreshQuietly = useCallback(() => {
    void refresh("merge");
  }, [refresh]);

  useRestoreViewScroll(snapshot?.scrollY ?? 0);
  usePersistViewScroll(cacheKey, Boolean(snapshot));
  useVisibilityRefresh(refreshQuietly);

  const hasSearchFilters = hasActiveSearchFilters(filters);
  const hasMoments = (snapshot?.items.length ?? 0) > 0;
  const canUseJournalTools = hasMoments || hasSearchFilters;
  const hasExactlyOneMoment =
    !hasSearchFilters && snapshot?.items.length === 1 && !snapshot.hasMore;

  return (
    <PullToRefresh
      onRefresh={() => refresh("replace")}
      disabled={refreshing && !snapshot}
    >
      <SavedToast
        initialVisible={showSavedToast}
        hint={
          showSavedToast && hasExactlyOneMoment
            ? "Next time, open Add more on Capture to attach a photo or voice memo."
            : null
        }
      />

      {hasMoments && showEmptySurprise ? (
        <Alert className="mb-8">
          Capture your first moment, then “Surprise me” can bring one back.
        </Alert>
      ) : null}

      {canUseJournalTools ? (
        <TimelineOnThisDayProvider>
          <TimelineTools
            key={hasSearchFilters ? "searching" : "browsing"}
            initialTool={hasSearchFilters ? "find" : null}
            findContent={<DeferredTimelineSearch filters={filters} />}
            revisitPreview={<DeferredOnThisDayPreview />}
            revisitContent={
              <>
                <DeferredTimelineRevisit
                  searchFilters={filters}
                  resurfacingFilters={resurfacingFilters}
                />
                <TimelineSurpriseLink />
              </>
            }
          />
        </TimelineOnThisDayProvider>
      ) : null}

      {error && !snapshot ? (
        <Alert variant="error">{error}</Alert>
      ) : !snapshot ? (
        <>
          <p className="sr-only">Loading moments</p>
          <TimelineFeedSkeleton />
        </>
      ) : snapshot.items.length === 0 && hasSearchFilters ? (
        <TimelineSearchEmptyState />
      ) : (
        <TimelineFeed
          key={`${cacheKey}:${feedRevision}`}
          initialMoments={snapshot.items}
          initialHasMore={snapshot.hasMore}
          initialNextCursor={snapshot.nextCursor}
          filters={filters}
          onSnapshotChange={(next) => {
            applySnapshot(
              {
                items: next.moments,
                hasMore: next.hasMore,
                nextCursor: next.nextCursor,
                updatedAt: snapshot.updatedAt,
                scrollY: snapshot.scrollY,
              },
              false,
            );
          }}
        />
      )}
    </PullToRefresh>
  );
}
