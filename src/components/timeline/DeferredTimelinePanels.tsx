"use client";

import { useEffect, useState } from "react";

import {
  loadOnThisDayTimeline,
  loadResurfacedTimeline,
  loadTimelineTags,
} from "@/app/timeline/actions";
import { OnThisDayContent } from "@/components/timeline/OnThisDayContent";
import { ResurfacingChooser } from "@/components/timeline/ResurfacingChooser";
import { ResurfacingContent } from "@/components/timeline/ResurfacingContent";
import { TimelineSearchForm } from "@/components/timeline/TimelineSearchForm";
import { Alert } from "@/components/ui/Alert";
import { TimelineSearchSkeleton } from "@/components/ui/LoadingSkeleton";
import type { TimelineMoment, UserTag } from "@/lib/moments/queries";
import {
  hasActiveSearchFilters,
  type TimelineSearchFilters,
} from "@/lib/moments/search";
import {
  hasActiveResurfacingFilters,
  type ResurfacingFilters,
} from "@/lib/moments/themes";

type DeferredResult<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; message: string };

export function DeferredTimelineSearch({
  filters,
}: {
  filters: TimelineSearchFilters;
}) {
  const [result, setResult] = useState<DeferredResult<UserTag[]>>({
    status: "loading",
  });

  useEffect(() => {
    let active = true;

    void loadTimelineTags().then((response) => {
      if (!active) {
        return;
      }

      setResult(
        response.error
          ? { status: "error", message: response.error }
          : { status: "ready", data: response.tags },
      );
    });

    return () => {
      active = false;
    };
  }, []);

  if (result.status === "loading") {
    return <TimelineSearchSkeleton />;
  }

  if (result.status === "error") {
    return <Alert variant="error">{result.message}</Alert>;
  }

  return <TimelineSearchForm filters={filters} tags={result.data} embedded />;
}

type OnThisDayData = {
  moments: TimelineMoment[];
  todayIso: string;
  timeZone: string;
};

export function DeferredTimelineRevisit({
  searchFilters,
  resurfacingFilters,
}: {
  searchFilters: TimelineSearchFilters;
  resurfacingFilters: ResurfacingFilters;
}) {
  const [onThisDay, setOnThisDay] = useState<DeferredResult<OnThisDayData>>({
    status: "loading",
  });
  const [resurfaced, setResurfaced] = useState<
    DeferredResult<TimelineMoment[]>
  >({ status: "loading" });
  const isSearching = hasActiveSearchFilters(searchFilters);
  const shouldLoadResurfaced = hasActiveResurfacingFilters(resurfacingFilters);

  useEffect(() => {
    if (isSearching) {
      return;
    }

    let active = true;

    void loadOnThisDayTimeline().then((response) => {
      if (!active) {
        return;
      }

      setOnThisDay(
        response.error
          ? { status: "error", message: response.error }
          : {
              status: "ready",
              data: {
                moments: response.moments,
                todayIso: response.todayIso,
                timeZone: response.timeZone,
              },
            },
      );
    });

    if (shouldLoadResurfaced) {
      void loadResurfacedTimeline(resurfacingFilters).then((response) => {
        if (!active) {
          return;
        }

        setResurfaced(
          response.error
            ? { status: "error", message: response.error }
            : { status: "ready", data: response.moments },
        );
      });
    }

    return () => {
      active = false;
    };
  }, [isSearching, resurfacingFilters, shouldLoadResurfaced]);

  if (isSearching) {
    return null;
  }

  return (
    <>
      {onThisDay.status === "loading" ? (
        <div
          className="h-36 animate-pulse rounded-2xl border border-border bg-surface"
          aria-hidden="true"
        />
      ) : onThisDay.status === "error" ? (
        <Alert variant="error">{onThisDay.message}</Alert>
      ) : (
        <OnThisDayContent {...onThisDay.data} />
      )}

      {!shouldLoadResurfaced ? (
        <ResurfacingChooser />
      ) : resurfaced.status === "loading" ? (
        <div
          className="h-44 animate-pulse rounded-2xl border border-border bg-surface"
          aria-hidden="true"
        />
      ) : resurfaced.status === "error" ? (
        <Alert variant="error">{resurfaced.message}</Alert>
      ) : (
        <ResurfacingContent
          moments={resurfaced.data}
          resurfacingFilters={resurfacingFilters}
        />
      )}
    </>
  );
}
