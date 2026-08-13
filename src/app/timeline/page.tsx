import { after } from "next/server";
import { Suspense } from "react";

import { loadOnThisDayTimeline } from "@/app/timeline/actions";
import {
  cleanupExpiredDeletedMoments,
  finalizeDeletedMoment,
  undoDeleteMoment,
} from "@/app/moments/[id]/actions";
import { JournalGreeting } from "@/components/timeline/JournalGreeting";
import {
  DeferredOnThisDayPreview,
  DeferredTimelineRevisit,
  DeferredTimelineSearch,
  TimelineOnThisDayProvider,
} from "@/components/timeline/DeferredTimelinePanels";
import { TimelineResults } from "@/components/timeline/TimelinePageSections";
import { TimelineSurpriseLink } from "@/components/timeline/TimelineSurpriseLink";
import { TimelineTools } from "@/components/timeline/TimelineTools";
import { Alert } from "@/components/ui/Alert";
import { TimelineFeedSkeleton } from "@/components/ui/LoadingSkeleton";
import { PageContainer, PageShell } from "@/components/ui/PageShell";
import { SavedToast } from "@/components/ui/SavedToast";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
import {
  hasActiveSearchFilters,
  parseSearchParams,
  type TimelineSearchFilters,
} from "@/lib/moments/search";
import { parseResurfacingParams } from "@/lib/moments/themes";
import {
  getTimelineMoments,
  type TimelineMoment,
  type TimelinePageResult,
} from "@/lib/moments/queries";
import { TIMELINE_INITIAL_PAGE_SIZE } from "@/lib/moments/pagination";
import { MOMENT_DELETE_UNDO_MS } from "@/lib/moments/delete-undo";
import { isUuid } from "@/lib/moments/direct-upload";
import { getUserProfile } from "@/lib/profile/queries";
import { formatProfileNameForDisplay } from "@/lib/profile/validation";
import type { ResurfacingFilters } from "@/lib/moments/themes";

type TimelinePageProps = {
  searchParams: Promise<{
    q?: string | string[];
    tag?: string | string[];
    favorite?: string | string[];
    saved?: string | string[];
    deleted?: string | string[];
    theme?: string | string[];
    media?: string | string[];
    surprise?: string | string[];
  }>;
};

export default async function TimelinePage({
  searchParams,
}: TimelinePageProps) {
  const rawParams = await searchParams;
  const filters = parseSearchParams(rawParams);
  const resurfacingFilters = parseResurfacingParams(rawParams);
  const showSavedToast = rawParams.saved === "1";
  const deletedMomentId =
    typeof rawParams.deleted === "string" && isUuid(rawParams.deleted)
      ? rawParams.deleted
      : null;
  const timelinePromise = getTimelineMoments(filters, {
    limit: TIMELINE_INITIAL_PAGE_SIZE,
  });
  const onThisDayPromise = hasActiveSearchFilters(filters)
    ? Promise.resolve(null)
    : loadOnThisDayTimeline();
  const profilePromise = getUserProfile();
  const deletedMomentCleanupPromise = cleanupExpiredDeletedMoments();

  after(async () => {
    await deletedMomentCleanupPromise;
  });

  return (
    <PageShell>
      <PageContainer size="xl" className="pt-6 pb-8 sm:pt-9 sm:pb-12">
        <header className="mb-7 min-w-0 px-1 pt-1 sm:mb-10 sm:px-2 sm:pt-2">
          <Suspense
            fallback={<div className="h-12 sm:h-16" aria-hidden="true" />}
          >
            <TimelineGreeting profilePromise={profilePromise} />
          </Suspense>
        </header>

        <SavedToast
          initialVisible={Boolean(deletedMomentId)}
          queryParam="deleted"
          message="Moment deleted."
          autoDismissMs={MOMENT_DELETE_UNDO_MS}
          actionLabel="Undo"
          onAction={
            deletedMomentId
              ? undoDeleteMoment.bind(null, deletedMomentId)
              : undefined
          }
          onExpire={
            deletedMomentId
              ? finalizeDeletedMoment.bind(null, deletedMomentId)
              : undefined
          }
        />

        <Suspense
          key={`${filters.keyword}:${filters.tagIds.join(",")}:${filters.favoriteOnly}`}
          fallback={
            <>
              <p className="sr-only">Loading moments</p>
              <TimelineFeedSkeleton />
            </>
          }
        >
          <TimelineHomeContent
            filters={filters}
            resurfacingFilters={resurfacingFilters}
            timelinePromise={timelinePromise}
            onThisDayPromise={onThisDayPromise}
            showSavedToast={showSavedToast}
            showEmptySurprise={rawParams.surprise === "empty"}
          />
        </Suspense>
      </PageContainer>
      <ScrollToTopButton />
    </PageShell>
  );
}

async function TimelineGreeting({
  profilePromise,
}: {
  profilePromise: ReturnType<typeof getUserProfile>;
}) {
  const profile = await profilePromise;

  return (
    <JournalGreeting
      name={
        profile?.hasDisplayName
          ? formatProfileNameForDisplay(profile.displayName)
          : "there"
      }
    />
  );
}

async function TimelineHomeContent({
  filters,
  resurfacingFilters,
  timelinePromise,
  onThisDayPromise,
  showSavedToast,
  showEmptySurprise,
}: {
  filters: TimelineSearchFilters;
  resurfacingFilters: ResurfacingFilters;
  timelinePromise: Promise<TimelinePageResult<TimelineMoment>>;
  onThisDayPromise: Promise<Awaited<
    ReturnType<typeof loadOnThisDayTimeline>
  > | null>;
  showSavedToast: boolean;
  showEmptySurprise: boolean;
}) {
  const [timelinePage, onThisDayResult] = await Promise.all([
    timelinePromise,
    onThisDayPromise,
  ]);
  const hasMoments = timelinePage.items.length > 0;
  const hasSearchFilters = hasActiveSearchFilters(filters);
  const canUseJournalTools = hasMoments || hasSearchFilters;
  const hasExactlyOneMoment =
    !hasSearchFilters &&
    timelinePage.items.length === 1 &&
    !timelinePage.hasMore;

  return (
    <>
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
        <TimelineOnThisDayProvider result={onThisDayResult}>
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

      <TimelineResults
        filters={filters}
        timelinePromise={Promise.resolve(timelinePage)}
      />
    </>
  );
}
