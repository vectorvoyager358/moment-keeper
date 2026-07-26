"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { loadMoreTimelineMoments } from "@/app/timeline/actions";
import { MomentCard } from "@/components/timeline/MomentCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import type { TimelineMoment } from "@/lib/moments/queries";
import type { TimelineCursor } from "@/lib/moments/pagination";
import {
  hasActiveSearchFilters,
  type TimelineSearchFilters,
} from "@/lib/moments/search";

type TimelineFeedProps = {
  initialMoments: TimelineMoment[];
  initialHasMore: boolean;
  initialNextCursor?: TimelineCursor | null;
  filters: TimelineSearchFilters;
};

const MAX_STAGGER_INDEX = 8;
const STAGGER_MS = 50;

export function TimelineFeed({
  initialMoments,
  initialHasMore,
  initialNextCursor = null,
  filters,
}: TimelineFeedProps) {
  const [moments, setMoments] = useState(initialMoments);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const loadAheadRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const handleLoadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) {
      return;
    }

    loadingRef.current = true;
    setError(null);

    startTransition(async () => {
      try {
        const pagination = hasActiveSearchFilters(filters)
          ? { offset: moments.length }
          : { cursor: nextCursor };
        const result = await loadMoreTimelineMoments(filters, pagination);

        if (result.error) {
          setError(result.error);
          return;
        }

        setMoments((current) => [...current, ...result.items]);
        setHasMore(result.hasMore);
        setNextCursor(result.nextCursor ?? null);
      } finally {
        loadingRef.current = false;
      }
    });
  }, [filters, hasMore, moments.length, nextCursor]);

  useEffect(() => {
    const loadAhead = loadAheadRef.current;
    if (
      !loadAhead ||
      !hasMore ||
      error ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          handleLoadMore();
        }
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(loadAhead);
    return () => observer.disconnect();
  }, [error, handleLoadMore, hasMore]);

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
            <MomentCard
              moment={moment}
              highlightQuery={filters.keyword}
              priorityMedia={index === 0}
            />
          </li>
        ))}
      </ul>

      {error ? (
        <Alert variant="error" className="mt-6">
          {error}
        </Alert>
      ) : null}

      {hasMore ? (
        <div
          ref={loadAheadRef}
          className="mt-8 flex min-h-16 items-center justify-center"
        >
          <Button
            type="button"
            variant="secondary"
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {isPending ? "Loading earlier moments…" : "Load earlier moments"}
          </Button>
        </div>
      ) : null}
    </>
  );
}
