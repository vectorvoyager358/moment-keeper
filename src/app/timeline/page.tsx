import Link from "next/link";
import { PenLine, Shuffle } from "lucide-react";
import { Suspense } from "react";

import { AppNav } from "@/components/AppNav";
import {
  TimelineResults,
  TimelineSearchSection,
} from "@/components/timeline/TimelinePageSections";
import { OnThisDaySection } from "@/components/timeline/OnThisDaySection";
import { ResurfacingSection } from "@/components/timeline/ResurfacingSection";
import { Alert } from "@/components/ui/Alert";
import { buttonClassName } from "@/components/ui/Button";
import {
  TimelineFeedSkeleton,
  TimelineSearchSkeleton,
} from "@/components/ui/LoadingSkeleton";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { SavedToast } from "@/components/ui/SavedToast";
import { parseSearchParams } from "@/lib/moments/search";
import { parseResurfacingParams } from "@/lib/moments/themes";

type TimelinePageProps = {
  searchParams: Promise<{
    q?: string | string[];
    tag?: string | string[];
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

  return (
    <PageShell>
      <AppNav current="timeline" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <PageHeader
          title="Your journal"
          description="A quiet place for the moments you want to keep."
          action={
            <div className="flex flex-wrap justify-end gap-2">
              <Link
                href="/timeline/surprise"
                className={buttonClassName({
                  variant: "secondary",
                  size: "sm",
                })}
              >
                <Shuffle className="h-4 w-4" aria-hidden />
                Surprise me
              </Link>
              <Link href="/capture" className={buttonClassName({ size: "sm" })}>
                <PenLine className="h-4 w-4" aria-hidden />
                Keep a moment
              </Link>
            </div>
          }
        />

        <SavedToast initialVisible={showSavedToast} />

        {rawParams.surprise === "empty" ? (
          <Alert className="mb-8">
            Keep your first moment, then “Surprise me” can bring one back.
          </Alert>
        ) : null}

        <Suspense
          key={`${resurfacingFilters.themes.join(",")}:${resurfacingFilters.mediaType ?? "all"}`}
          fallback={
            <div
              className="mb-8 h-44 animate-pulse rounded-2xl border border-border bg-surface"
              aria-hidden="true"
            />
          }
        >
          <ResurfacingSection
            searchFilters={filters}
            resurfacingFilters={resurfacingFilters}
          />
        </Suspense>

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
