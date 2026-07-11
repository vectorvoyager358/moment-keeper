"use client";

import { useState, useTransition } from "react";

import { loadMoreTimelineMoments } from "@/app/timeline/actions";
import { MomentCard } from "@/components/timeline/MomentCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import type { TimelineMoment } from "@/lib/moments/queries";
import type { TimelineSearchFilters } from "@/lib/moments/search";

type TimelineFeedProps = {
  initialMoments: TimelineMoment[];
  initialHasMore: boolean;
  filters: TimelineSearchFilters;
};

const MAX_STAGGER_INDEX = 8;
const STAGGER_MS = 50;

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
        {moments.map((moment, index) => (
          <li
            key={moment.id}
            className="animate-fade-in-up"
            style={{
              animationDelay: `${Math.min(index, MAX_STAGGER_INDEX) * STAGGER_MS}ms`,
            }}
          >
            <MomentCard moment={moment} highlightQuery={filters.keyword} />
          </li>
        ))}
      </ul>

      {error ? (
        <Alert variant="error" className="mt-6">
          {error}
        </Alert>
      ) : null}

      {hasMore ? (
        <div className="mt-8 flex justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {isPending ? "Finding more…" : "Show earlier moments"}
          </Button>
        </div>
      ) : null}
    </>
  );
}
