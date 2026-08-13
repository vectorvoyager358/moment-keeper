import type { MediaType } from "@/lib/database.types";
import type { MediaGalleryItem } from "@/lib/moments/queries";
import type { TimelineCursor } from "@/lib/moments/pagination";
import type { TimelineSearchFilters } from "@/lib/moments/search";
import type { TimelineMoment } from "@/lib/moments/timeline";

export const VIEW_CACHE_HIDDEN_REFRESH_MS = 5 * 60_000;

export type TimelineViewSnapshot = {
  items: TimelineMoment[];
  hasMore: boolean;
  nextCursor: TimelineCursor | null;
  updatedAt: number;
  scrollY: number;
};

export type GalleryViewSnapshot = {
  items: MediaGalleryItem[];
  updatedAt: number;
  scrollY: number;
};

export type CalendarViewSnapshot = {
  moments: TimelineMoment[];
  updatedAt: number;
  scrollY: number;
};

type ViewSnapshot =
  | { kind: "timeline"; value: TimelineViewSnapshot }
  | { kind: "gallery"; value: GalleryViewSnapshot }
  | { kind: "calendar"; value: CalendarViewSnapshot };

const snapshots = new Map<string, ViewSnapshot>();

export function timelineViewKey(filters: TimelineSearchFilters): string {
  return [
    "timeline",
    filters.keyword,
    [...filters.tagIds].sort().join(","),
    filters.favoriteOnly ? "1" : "0",
  ].join(":");
}

export function galleryViewKey(mediaType: MediaType | null): string {
  return `gallery:${mediaType ?? "all"}`;
}

export function calendarViewKey(year: number, month: number): string {
  return `calendar:${year}-${month}`;
}

export function getTimelineView(
  filters: TimelineSearchFilters,
): TimelineViewSnapshot | null {
  const entry = snapshots.get(timelineViewKey(filters));
  return entry?.kind === "timeline" ? entry.value : null;
}

export function setTimelineView(
  filters: TimelineSearchFilters,
  snapshot: Omit<TimelineViewSnapshot, "updatedAt" | "scrollY"> &
    Partial<Pick<TimelineViewSnapshot, "updatedAt" | "scrollY">>,
): TimelineViewSnapshot {
  const current = getTimelineView(filters);
  const next: TimelineViewSnapshot = {
    items: snapshot.items,
    hasMore: snapshot.hasMore,
    nextCursor: snapshot.nextCursor,
    updatedAt: snapshot.updatedAt ?? Date.now(),
    scrollY: snapshot.scrollY ?? current?.scrollY ?? 0,
  };

  snapshots.set(timelineViewKey(filters), { kind: "timeline", value: next });
  return next;
}

export function getGalleryView(
  mediaType: MediaType | null,
): GalleryViewSnapshot | null {
  const entry = snapshots.get(galleryViewKey(mediaType));
  return entry?.kind === "gallery" ? entry.value : null;
}

export function setGalleryView(
  mediaType: MediaType | null,
  snapshot: Omit<GalleryViewSnapshot, "updatedAt" | "scrollY"> &
    Partial<Pick<GalleryViewSnapshot, "updatedAt" | "scrollY">>,
): GalleryViewSnapshot {
  const current = getGalleryView(mediaType);
  const next: GalleryViewSnapshot = {
    items: snapshot.items,
    updatedAt: snapshot.updatedAt ?? Date.now(),
    scrollY: snapshot.scrollY ?? current?.scrollY ?? 0,
  };

  snapshots.set(galleryViewKey(mediaType), { kind: "gallery", value: next });
  return next;
}

export function filterGalleryItems(
  items: MediaGalleryItem[],
  mediaType: MediaType | null,
): MediaGalleryItem[] {
  if (!mediaType) {
    return items;
  }

  return items.filter((item) => item.mediaType === mediaType);
}

export function galleryFilterUrl(mediaType: MediaType | null): string {
  return mediaType
    ? `/browse?view=media&media=${mediaType}`
    : "/browse?view=media";
}

export function getCalendarView(
  year: number,
  month: number,
): CalendarViewSnapshot | null {
  const entry = snapshots.get(calendarViewKey(year, month));
  return entry?.kind === "calendar" ? entry.value : null;
}

export function setCalendarView(
  year: number,
  month: number,
  snapshot: Omit<CalendarViewSnapshot, "updatedAt" | "scrollY"> &
    Partial<Pick<CalendarViewSnapshot, "updatedAt" | "scrollY">>,
): CalendarViewSnapshot {
  const current = getCalendarView(year, month);
  const next: CalendarViewSnapshot = {
    moments: snapshot.moments,
    updatedAt: snapshot.updatedAt ?? Date.now(),
    scrollY: snapshot.scrollY ?? current?.scrollY ?? 0,
  };

  snapshots.set(calendarViewKey(year, month), {
    kind: "calendar",
    value: next,
  });
  return next;
}

export function setViewScroll(key: string, scrollY: number): void {
  const entry = snapshots.get(key);
  if (!entry) {
    return;
  }

  entry.value.scrollY = scrollY;
}

export function isOlderTimelineMoment(
  item: Pick<TimelineMoment, "id" | "occurred_at">,
  lastIncoming: Pick<TimelineMoment, "id" | "occurred_at">,
): boolean {
  const occurred = item.occurred_at.localeCompare(lastIncoming.occurred_at);
  if (occurred !== 0) {
    return occurred < 0;
  }

  return item.id < lastIncoming.id;
}

export function mergeTimelineView(
  current: TimelineViewSnapshot,
  incoming: {
    items: TimelineMoment[];
    hasMore: boolean;
    nextCursor?: TimelineCursor | null;
  },
): Omit<TimelineViewSnapshot, "updatedAt" | "scrollY"> {
  const incomingIds = new Set(incoming.items.map((item) => item.id));
  const lastIncoming = incoming.items.at(-1);
  const older = lastIncoming
    ? current.items.filter(
        (item) =>
          !incomingIds.has(item.id) &&
          isOlderTimelineMoment(item, lastIncoming),
      )
    : [];

  return {
    items: [...incoming.items, ...older],
    hasMore: older.length > 0 ? current.hasMore : incoming.hasMore,
    nextCursor:
      older.length > 0 ? current.nextCursor : (incoming.nextCursor ?? null),
  };
}

export function removeMomentFromViewCache(momentId: string): void {
  for (const [key, entry] of snapshots) {
    if (entry.kind === "timeline") {
      snapshots.set(key, {
        kind: "timeline",
        value: {
          ...entry.value,
          items: entry.value.items.filter((item) => item.id !== momentId),
        },
      });
      continue;
    }

    if (entry.kind === "gallery") {
      snapshots.set(key, {
        kind: "gallery",
        value: {
          ...entry.value,
          items: entry.value.items.filter((item) => item.momentId !== momentId),
        },
      });
      continue;
    }

    snapshots.set(key, {
      kind: "calendar",
      value: {
        ...entry.value,
        moments: entry.value.moments.filter((item) => item.id !== momentId),
      },
    });
  }
}

export function patchCachedMomentFavorite(
  momentId: string,
  isFavorite: boolean,
): void {
  for (const [key, entry] of snapshots) {
    if (entry.kind !== "timeline") {
      continue;
    }

    const favoriteOnly = key.endsWith(":1");
    snapshots.set(key, {
      kind: "timeline",
      value: {
        ...entry.value,
        items: entry.value.items
          .map((item) =>
            item.id === momentId ? { ...item, isFavorite } : item,
          )
          .filter(
            (item) => !(favoriteOnly && item.id === momentId && !isFavorite),
          ),
      },
    });
  }
}

export function upsertCachedTimelineMoment(
  filters: TimelineSearchFilters,
  moment: TimelineMoment,
): TimelineViewSnapshot | null {
  const current = getTimelineView(filters);
  if (!current) {
    return null;
  }

  const withoutDuplicate = current.items.filter(
    (item) => item.id !== moment.id,
  );
  const items = [...withoutDuplicate, moment].sort((left, right) => {
    const occurredAtDifference = right.occurred_at.localeCompare(
      left.occurred_at,
    );
    return occurredAtDifference || right.id.localeCompare(left.id);
  });

  return setTimelineView(filters, {
    ...current,
    items,
  });
}

export function shouldFetchFreshView(
  hasSnapshot: boolean,
  force = false,
): boolean {
  return force || !hasSnapshot;
}

export function didTimelineItemsChange(
  current: TimelineMoment[] | undefined,
  next: TimelineMoment[],
): boolean {
  if (!current || current.length !== next.length) {
    return true;
  }

  return current.some((item, index) => {
    const other = next[index];
    return (
      item.id !== other.id ||
      item.body !== other.body ||
      item.isFavorite !== other.isFavorite ||
      item.thumbnailUrl !== other.thumbnailUrl ||
      item.photoUrl !== other.photoUrl
    );
  });
}

export type OnThisDayView = {
  moments: TimelineMoment[];
  todayIso: string;
  timeZone: string;
  error?: string;
};

let onThisDayView: OnThisDayView | null = null;

export function getOnThisDayView(): OnThisDayView | null {
  return onThisDayView;
}

export function setOnThisDayView(value: OnThisDayView): void {
  onThisDayView = value;
}

export function invalidateJournalViews(): void {
  onThisDayView = null;
  for (const key of snapshots.keys()) {
    if (key.startsWith("timeline:")) {
      snapshots.delete(key);
    }
  }
}

export function invalidateBrowseViews(): void {
  for (const key of snapshots.keys()) {
    if (key.startsWith("gallery:") || key.startsWith("calendar:")) {
      snapshots.delete(key);
    }
  }
}

export function invalidateAllViewCaches(): void {
  onThisDayView = null;
  snapshots.clear();
}
