import Link from "next/link";
import { Suspense } from "react";

import { AppNav } from "@/components/AppNav";
import {
  TimelineResults,
  TimelineSearchSection,
} from "@/components/timeline/TimelinePageSections";
import { OnThisDaySection } from "@/components/timeline/OnThisDaySection";
import { buttonClassName } from "@/components/ui/Button";
import {
  TimelineFeedSkeleton,
  TimelineSearchSkeleton,
} from "@/components/ui/LoadingSkeleton";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { SavedToast } from "@/components/ui/SavedToast";
import { parseSearchParams } from "@/lib/moments/search";

type TimelinePageProps = {
  searchParams: Promise<{
    q?: string | string[];
    tag?: string | string[];
    saved?: string | string[];
  }>;
};

export default async function TimelinePage({
  searchParams,
}: TimelinePageProps) {
  const rawParams = await searchParams;
  const filters = parseSearchParams(rawParams);
  const showSavedToast = rawParams.saved === "1";

  return (
    <PageShell>
      <AppNav current="timeline" />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <PageHeader
          title="Timeline"
          description="Your moments, newest first."
          action={
            <Link href="/capture" className={buttonClassName({ size: "sm" })}>
              + Capture
            </Link>
          }
        />

        <SavedToast initialVisible={showSavedToast} />

        <Suspense
          fallback={
            <div
              className="mb-8 h-36 animate-pulse rounded-2xl border border-border bg-surface"
              aria-hidden="true"
            />
          }
        >
          <OnThisDaySection filters={filters} />
        </Suspense>

        <div className="mb-8">
          <Suspense fallback={<TimelineSearchSkeleton />}>
            <TimelineSearchSection filters={filters} />
          </Suspense>
        </div>

        <Suspense
          key={`${filters.keyword}:${filters.tagIds.join(",")}`}
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
    </PageShell>
  );
}
