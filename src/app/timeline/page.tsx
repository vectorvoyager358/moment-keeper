import { Suspense } from "react";

import { KeepMomentLink } from "@/components/KeepMomentLink";
import { JournalGreeting } from "@/components/timeline/JournalGreeting";
import { OnThisDaySection } from "@/components/timeline/OnThisDaySection";
import { ResurfacingSection } from "@/components/timeline/ResurfacingSection";
import { TimelineCollapsiblePanel } from "@/components/timeline/TimelineCollapsiblePanel";
import {
  TimelineResults,
  TimelineSearchSection,
} from "@/components/timeline/TimelinePageSections";
import { TimelineSurpriseLink } from "@/components/timeline/TimelineSurpriseLink";
import { Alert } from "@/components/ui/Alert";
import {
  TimelineFeedSkeleton,
  TimelineSearchSkeleton,
} from "@/components/ui/LoadingSkeleton";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { SavedToast } from "@/components/ui/SavedToast";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
import {
  hasActiveSearchFilters,
  parseSearchParams,
} from "@/lib/moments/search";
import { parseResurfacingParams } from "@/lib/moments/themes";
import { getUserMomentCount } from "@/lib/moments/queries";
import { getUserProfile } from "@/lib/profile/queries";
import { formatProfileNameForDisplay } from "@/lib/profile/validation";

type TimelinePageProps = {
  searchParams: Promise<{
    q?: string | string[];
    tag?: string | string[];
    favorite?: string | string[];
    saved?: string | string[];
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
  const momentCount = await getUserMomentCount();
  const profile = await getUserProfile();
  const hasMoments = momentCount > 0;
  const hasSearchFilters = hasActiveSearchFilters(filters);

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {profile?.hasDisplayName ? (
          <JournalGreeting
            name={formatProfileNameForDisplay(profile.displayName)}
          />
        ) : null}

        <PageHeader
          title="Your journal"
          description="A quiet place for the moments you want to keep."
          action={<KeepMomentLink />}
        />

        <SavedToast
          initialVisible={showSavedToast}
          hint={
            showSavedToast && momentCount === 1
              ? "Next time, open Add more on Capture to attach a photo or voice memo."
              : null
          }
        />

        {hasMoments && rawParams.surprise === "empty" ? (
          <Alert className="mb-8">
            Capture your first moment, then “Surprise me” can bring one back.
          </Alert>
        ) : null}

        {hasMoments ? (
          <TimelineCollapsiblePanel
            panelId="find"
            title="Find"
            description="Search your journal by words, tags, or favorites."
            initialOpen={hasSearchFilters}
            className="mt-6"
          >
            <Suspense fallback={<TimelineSearchSkeleton />}>
              <TimelineSearchSection filters={filters} />
            </Suspense>
          </TimelineCollapsiblePanel>
        ) : null}

        {hasMoments ? (
          <TimelineCollapsiblePanel
            panelId="revisit"
            title="Revisit"
            description="On this day, themes, and a surprise draw from your journal."
          >
            <Suspense
              fallback={
                <div
                  className="h-36 animate-pulse rounded-2xl border border-border bg-surface"
                  aria-hidden="true"
                />
              }
            >
              <OnThisDaySection filters={filters} />
            </Suspense>

            <Suspense
              key={`${resurfacingFilters.themes.join(",")}:${resurfacingFilters.mediaType ?? "all"}`}
              fallback={
                <div
                  className="h-44 animate-pulse rounded-2xl border border-border bg-surface"
                  aria-hidden="true"
                />
              }
            >
              <ResurfacingSection
                searchFilters={filters}
                resurfacingFilters={resurfacingFilters}
              />
            </Suspense>

            <TimelineSurpriseLink />
          </TimelineCollapsiblePanel>
        ) : null}

        <Suspense
          key={`${filters.keyword}:${filters.tagIds.join(",")}:${filters.favoriteOnly}`}
          fallback={
            <>
              <p className="sr-only">Loading moments</p>
              <TimelineFeedSkeleton />
            </>
          }
        >
          <TimelineResults filters={filters} />
        </Suspense>
      </main>
      <ScrollToTopButton />
    </PageShell>
  );
}
