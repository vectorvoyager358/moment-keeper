"use client";

import { useState, useTransition } from "react";

import { loadMoreTimelineMoments } from "@/app/timeline/actions";
import { MomentCard } from "@/components/timeline/MomentCard";
import type { TimelineMoment } from "@/lib/moments/queries";
import type { TimelineSearchFilters } from "@/lib/moments/search";

type TimelineFeedProps = {
  initialMoments: TimelineMoment[];
  initialHasMore: boolean;
  filters: TimelineSearchFilters;
};

export function TimelineFeed({
  initialMoments,
  initialHasMore,
  filters,
}: TimelineFeedProps) {
  const [moments, setMoments] = useState(initialMoments);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    setError(null);

    startTransition(async () => {
      const result = await loadMoreTimelineMoments(filters, moments.length);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMoments((current) => [...current, ...result.items]);
      setHasMore(result.hasMore);
    });
  }

  return (
    <>
      <ul className="space-y-4">
        {moments.map((moment) => (
          <li key={moment.id}>
            <MomentCard moment={moment} />
          </li>
        ))}
      </ul>

      {error ? (
        <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {hasMore ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isPending}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            {isPending ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}
    </>
  );
}
