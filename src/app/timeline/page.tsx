import Link from "next/link";
import { Suspense } from "react";

import { AppNav } from "@/components/AppNav";
import {
  TimelineResults,
  TimelineSearchSection,
} from "@/components/timeline/TimelinePageSections";
import {
  TimelineFeedSkeleton,
  TimelineSearchSkeleton,
} from "@/components/ui/LoadingSkeleton";
import { parseSearchParams } from "@/lib/moments/search";

type TimelinePageProps = {
  searchParams: Promise<{
    q?: string | string[];
    tag?: string | string[];
  }>;
};

export default async function TimelinePage({
  searchParams,
}: TimelinePageProps) {
  const filters = parseSearchParams(await searchParams);

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <AppNav current="timeline" />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Timeline
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Your moments, newest first.
            </p>
          </div>
          <Link
            href="/capture"
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            + Capture
          </Link>
        </div>

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
    </div>
  );
}
