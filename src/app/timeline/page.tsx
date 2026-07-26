import { Suspense } from "react";

import { KeepMomentLink } from "@/components/KeepMomentLink";
import { JournalGreeting } from "@/components/timeline/JournalGreeting";
import {
  DeferredTimelineRevisit,
  DeferredTimelineSearch,
} from "@/components/timeline/DeferredTimelinePanels";
import { TimelineCollapsiblePanel } from "@/components/timeline/TimelineCollapsiblePanel";
import { TimelineResults } from "@/components/timeline/TimelinePageSections";
import { TimelineSurpriseLink } from "@/components/timeline/TimelineSurpriseLink";
import { Alert } from "@/components/ui/Alert";
import { TimelineFeedSkeleton } from "@/components/ui/LoadingSkeleton";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
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
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Suspense fallback={<div className="h-8" aria-hidden="true" />}>
          <TimelineGreeting profilePromise={profilePromise} />
        </Suspense>

        <PageHeader
          title="Your journal"
          description="A quiet place for the moments you want to keep."
          action={<KeepMomentLink />}
        />

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
      </main>
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
        <TimelineCollapsiblePanel
          panelId="find"
          title="Find"
          description="Search your journal by words, tags, or favorites."
          initialOpen={hasSearchFilters}
          className="mt-6"
          combinedWhenOpen
        >
          <DeferredTimelineSearch filters={filters} />
        </TimelineCollapsiblePanel>
      ) : null}

      {canUseJournalTools ? (
        <TimelineCollapsiblePanel
          panelId="revisit"
          title="Revisit"
          description="On this day, themes, and a surprise draw from your journal."
        >
          <DeferredTimelineRevisit
            searchFilters={filters}
            resurfacingFilters={resurfacingFilters}
          />

          <TimelineSurpriseLink />
        </TimelineCollapsiblePanel>
      ) : null}

      <TimelineResults
        filters={filters}
        timelinePromise={Promise.resolve(timelinePage)}
      />
    </>
  );
}
