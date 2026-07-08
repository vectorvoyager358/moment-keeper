import Link from "next/link";

import { AppNav } from "@/components/AppNav";
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
  parseSearchParams,
} from "@/lib/moments/search";

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

  let timelinePage;
  let tags;

  try {
    [timelinePage, tags] = await Promise.all([
      getTimelineMoments(filters),
      getUserTags(),
    ]);
  } catch (error) {
    throw new Error(toUserErrorMessage(error, "Could not load your timeline."));
  }

  const isSearching = hasActiveSearchFilters(filters);

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
          <TimelineSearchForm filters={filters} tags={tags} />
        </div>

        {timelinePage.items.length === 0 ? (
          isSearching ? (
            <TimelineSearchEmptyState />
          ) : (
            <TimelineEmptyState />
          )
        ) : (
          <TimelineFeed
            key={`${filters.keyword}:${filters.tagIds.join(",")}`}
            initialMoments={timelinePage.items}
            initialHasMore={timelinePage.hasMore}
            filters={filters}
          />
        )}
      </main>
    </div>
  );
}
