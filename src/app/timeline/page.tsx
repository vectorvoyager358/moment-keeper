import { Suspense } from "react";

import { KeepMomentLink } from "@/components/KeepMomentLink";
import { JournalGreeting } from "@/components/timeline/JournalGreeting";
import {
  DeferredTimelineRevisit,
  DeferredTimelineSearch,
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
  const showDeletedToast = rawParams.deleted === "1";
  const timelinePromise = getTimelineMoments(filters, {
    limit: TIMELINE_INITIAL_PAGE_SIZE,
  });
  const profilePromise = getUserProfile();

  return (
    <PageShell>
      <PageContainer size="xl" className="pt-6 pb-8 sm:pt-9 sm:pb-12">
        <header className="mb-6 sm:mb-8">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <Suspense fallback={<div className="h-6" aria-hidden="true" />}>
                <TimelineGreeting profilePromise={profilePromise} />
              </Suspense>

              <h1 className="font-display text-[2rem] font-semibold leading-none tracking-[-0.035em] text-ink sm:text-[2.5rem]">
                Your journal
              </h1>
            </div>

            <KeepMomentLink className="mb-0.5 sm:mb-0" />
          </div>
        </header>

        <SavedToast
          initialVisible={showDeletedToast}
          queryParam="deleted"
          message="Moment deleted."
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

  return profile?.hasDisplayName ? (
    <JournalGreeting name={formatProfileNameForDisplay(profile.displayName)} />
  ) : null;
}

async function TimelineHomeContent({
  filters,
  resurfacingFilters,
  timelinePromise,
  showSavedToast,
  showEmptySurprise,
}: {
  filters: TimelineSearchFilters;
  resurfacingFilters: ResurfacingFilters;
  timelinePromise: Promise<TimelinePageResult<TimelineMoment>>;
  showSavedToast: boolean;
  showEmptySurprise: boolean;
}) {
  const timelinePage = await timelinePromise;
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
        <TimelineTools
          key={hasSearchFilters ? "searching" : "browsing"}
          initialTool={hasSearchFilters ? "find" : null}
          findContent={<DeferredTimelineSearch filters={filters} />}
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
      ) : null}

      <TimelineResults
        filters={filters}
        timelinePromise={Promise.resolve(timelinePage)}
      />
    </>
  );
}
