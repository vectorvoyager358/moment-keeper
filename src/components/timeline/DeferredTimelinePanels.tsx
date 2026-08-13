"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
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
import {
  TAGS_REMOVED_EVENT,
  type TagsRemovedEvent,
} from "@/lib/moments/tag-events";

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

  useEffect(() => {
    const removeDeletedTags = (event: Event) => {
      const removedIds = new Set((event as TagsRemovedEvent).detail ?? []);

      if (removedIds.size === 0) {
        return;
      }

      setResult((current) =>
        current.status === "ready"
          ? {
              status: "ready",
              data: current.data.filter((tag) => !removedIds.has(tag.id)),
            }
          : current,
      );
    };

    window.addEventListener(TAGS_REMOVED_EVENT, removeDeletedTags);
    return () =>
      window.removeEventListener(TAGS_REMOVED_EVENT, removeDeletedTags);
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

type OnThisDayResponse = OnThisDayData & { error?: string };
type OnThisDayResult = Exclude<
  DeferredResult<OnThisDayData>,
  { status: "loading" }
>;

const OnThisDayContext = createContext<OnThisDayResult | null>(null);

export function TimelineOnThisDayProvider({
  children,
  result,
}: {
  children: ReactNode;
  result: OnThisDayResponse | null;
}) {
  const contextValue: OnThisDayResult | null = result
    ? result.error
      ? { status: "error", message: result.error }
      : {
          status: "ready",
          data: {
            moments: result.moments,
            todayIso: result.todayIso,
            timeZone: result.timeZone,
          },
        }
    : null;

  return (
    <OnThisDayContext.Provider value={contextValue}>
      {children}
    </OnThisDayContext.Provider>
  );
}

function useOnThisDayResult() {
  return useContext(OnThisDayContext);
}

export function DeferredOnThisDayPreview() {
  const result = useOnThisDayResult();

  if (
    !result ||
    result.status !== "ready" ||
    result.data.moments.length === 0
  ) {
    return null;
  }

  return (
    <div className="mt-3 overflow-hidden rounded-3xl bg-surface p-4 shadow-card ring-1 ring-border/55 sm:mt-4 sm:p-6">
      <OnThisDayContent {...result.data} preview />
    </div>
  );
}

export function DeferredTimelineRevisit({
  searchFilters,
  resurfacingFilters,
}: {
  searchFilters: TimelineSearchFilters;
  resurfacingFilters: ResurfacingFilters;
}) {
  const onThisDay = useOnThisDayResult();
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
      {!onThisDay ? null : onThisDay.status === "error" ? (
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
