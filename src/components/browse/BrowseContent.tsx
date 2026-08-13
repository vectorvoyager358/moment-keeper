"use client";

import { useCallback, useEffect, useState } from "react";

import { loadBrowseCalendar, loadBrowseGallery } from "@/app/browse/actions";
import { CalendarView } from "@/components/browse/CalendarView";
import { MediaGallery } from "@/components/browse/MediaGallery";
import { Alert } from "@/components/ui/Alert";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import type { MediaType } from "@/lib/database.types";
import type { CalendarMonth } from "@/lib/moments/calendar";
import type { MediaGalleryItem } from "@/lib/moments/queries";
import type { TimelineMoment } from "@/lib/moments/timeline";
import {
  usePersistViewScroll,
  useRestoreViewScroll,
  useVisibilityRefresh,
} from "@/lib/moments/use-cached-view";
import {
  calendarViewKey,
  filterGalleryItems,
  galleryViewKey,
  getCalendarView,
  getGalleryView,
  setCalendarView,
  setGalleryView,
  shouldFetchFreshView,
} from "@/lib/moments/view-cache";

type BrowseContentProps =
  | {
      view: "media";
      mediaType: MediaType | null;
    }
  | {
      view: "calendar";
      calendar: CalendarMonth;
      selectedDay: string | null;
    };

export function BrowseContent(props: BrowseContentProps) {
  const [mediaType, setMediaType] = useState<MediaType | null>(
    props.view === "media" ? props.mediaType : null,
  );
  const cacheKey =
    props.view === "media"
      ? galleryViewKey(null)
      : calendarViewKey(props.calendar.year, props.calendar.month);
  const [galleryItems, setGalleryItems] = useState<MediaGalleryItem[] | null>(
    () =>
      props.view === "media" ? (getGalleryView(null)?.items ?? null) : null,
  );
  const [calendarMoments, setCalendarMoments] = useState<
    TimelineMoment[] | null
  >(() =>
    props.view === "calendar"
      ? (getCalendarView(props.calendar.year, props.calendar.month)?.moments ??
        null)
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const cachedScroll =
    props.view === "media"
      ? getGalleryView(null)?.scrollY
      : getCalendarView(props.calendar.year, props.calendar.month)?.scrollY;
  const hasSnapshot =
    props.view === "media" ? galleryItems !== null : calendarMoments !== null;
  const [refreshing, setRefreshing] = useState(!hasSnapshot);

  const applyGallery = useCallback(
    (result: Awaited<ReturnType<typeof loadBrowseGallery>>) => {
      if (result.error) {
        setError(result.error);
        setRefreshing(false);
        return;
      }

      setError(null);
      setGalleryView(null, {
        items: result.items,
      });
      setGalleryItems(result.items);
      setRefreshing(false);
    },
    [],
  );

  const applyCalendar = useCallback(
    (result: Awaited<ReturnType<typeof loadBrowseCalendar>>) => {
      if (result.error) {
        setError(result.error);
        setRefreshing(false);
        return;
      }

      if (props.view !== "calendar") {
        return;
      }

      setError(null);
      setCalendarView(props.calendar.year, props.calendar.month, {
        moments: result.moments,
      });
      setCalendarMoments(result.moments);
      setRefreshing(false);
    },
    [props],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);

    if (props.view === "media") {
      applyGallery(await loadBrowseGallery(null));
      return;
    }

    applyCalendar(
      await loadBrowseCalendar(props.calendar.year, props.calendar.month),
    );
  }, [applyCalendar, applyGallery, props]);

  useEffect(() => {
    if (!shouldFetchFreshView(hasSnapshot)) {
      return;
    }

    let active = true;

    if (props.view === "media") {
      void loadBrowseGallery(null).then((result) => {
        if (active) {
          applyGallery(result);
        }
      });
    } else {
      void loadBrowseCalendar(props.calendar.year, props.calendar.month).then(
        (result) => {
          if (active) {
            applyCalendar(result);
          }
        },
      );
    }

    return () => {
      active = false;
    };
  }, [applyCalendar, applyGallery, hasSnapshot, props]);

  useRestoreViewScroll(cachedScroll ?? 0);
  usePersistViewScroll(cacheKey, hasSnapshot);
  useVisibilityRefresh(refresh);

  return (
    <PullToRefresh onRefresh={refresh} disabled={refreshing && !hasSnapshot}>
      {error && !hasSnapshot ? (
        <Alert variant="error">{error}</Alert>
      ) : !hasSnapshot ? (
        <div
          className="h-[32rem] animate-pulse rounded-3xl bg-surface shadow-card ring-1 ring-border/60"
          aria-hidden
        />
      ) : props.view === "media" ? (
        <MediaGallery
          mediaType={mediaType}
          moments={filterGalleryItems(galleryItems ?? [], mediaType)}
          onMediaTypeChange={setMediaType}
        />
      ) : (
        <CalendarView
          year={props.calendar.year}
          month={props.calendar.month}
          selectedDay={props.selectedDay}
          moments={calendarMoments ?? []}
        />
      )}
    </PullToRefresh>
  );
}
