import { afterEach, describe, expect, it } from "vitest";

import type { TimelineMoment } from "@/lib/moments/timeline";
import {
  didTimelineItemsChange,
  getGalleryView,
  getTimelineView,
  invalidateAllViewCaches,
  mergeTimelineView,
  patchCachedMomentFavorite,
  removeMomentFromViewCache,
  setGalleryView,
  setTimelineView,
  shouldFetchFreshView,
  timelineViewKey,
} from "@/lib/moments/view-cache";

const emptyFilters = { keyword: "", tagIds: [], favoriteOnly: false };
const favoriteFilters = { keyword: "", tagIds: [], favoriteOnly: true };

function moment(id: string, occurredAt: string): TimelineMoment {
  return {
    id,
    body: id,
    occurred_at: occurredAt,
    location: null,
    linkUrl: null,
    isFavorite: false,
    tags: [],
    hasMedia: false,
    attachmentCount: 0,
    mediaType: null,
    thumbnailPath: null,
    thumbnailUrl: null,
    photoStoragePath: null,
    photoUrl: null,
    videoStoragePath: null,
    videoUrl: null,
  };
}

afterEach(() => {
  invalidateAllViewCaches();
});

describe("view cache", () => {
  it("keys journal snapshots by search filters", () => {
    expect(
      timelineViewKey({
        keyword: "lake",
        tagIds: ["b", "a"],
        favoriteOnly: true,
      }),
    ).toBe("timeline:lake:a,b:1");
  });

  it("keeps already-loaded older moments when a fresh first page arrives", () => {
    const newest = moment("m3", "2026-08-13T12:00:00.000Z");
    const middle = moment("m2", "2026-08-12T12:00:00.000Z");
    const older = moment("m1", "2026-08-11T12:00:00.000Z");

    const merged = mergeTimelineView(
      {
        items: [middle, older],
        hasMore: true,
        nextCursor: { occurredAt: older.occurred_at, id: older.id },
        updatedAt: 1,
        scrollY: 240,
      },
      {
        items: [newest, middle],
        hasMore: true,
        nextCursor: { occurredAt: middle.occurred_at, id: middle.id },
      },
    );

    expect(merged.items.map((item) => item.id)).toEqual(["m3", "m2", "m1"]);
    expect(merged.hasMore).toBe(true);
    expect(merged.nextCursor).toEqual({
      occurredAt: older.occurred_at,
      id: older.id,
    });
  });

  it("drops a deleted moment from the first page without keeping it in the tail", () => {
    const newest = moment("m3", "2026-08-13T12:00:00.000Z");
    const deleted = moment("m2", "2026-08-12T12:00:00.000Z");
    const older = moment("m1", "2026-08-11T12:00:00.000Z");

    const merged = mergeTimelineView(
      {
        items: [newest, deleted, older],
        hasMore: false,
        nextCursor: null,
        updatedAt: 1,
        scrollY: 0,
      },
      {
        items: [newest, older],
        hasMore: false,
        nextCursor: null,
      },
    );

    expect(merged.items.map((item) => item.id)).toEqual(["m3", "m1"]);
  });

  it("removes a deleted moment from journal and look-back snapshots", () => {
    setTimelineView(emptyFilters, {
      items: [
        moment("keep", "2026-08-13T12:00:00.000Z"),
        moment("gone", "2026-08-12T12:00:00.000Z"),
      ],
      hasMore: false,
      nextCursor: null,
    });
    setGalleryView(null, {
      items: [
        {
          id: "media-1",
          momentId: "gone",
          body: "gone",
          occurred_at: "2026-08-12T12:00:00.000Z",
          location: null,
          mediaType: "photo",
          thumbnailUrl: null,
          photoUrl: null,
          videoUrl: null,
        },
      ],
    });

    removeMomentFromViewCache("gone");

    expect(getTimelineView(emptyFilters)?.items.map((item) => item.id)).toEqual(
      ["keep"],
    );
    expect(getGalleryView(null)?.items).toEqual([]);
  });

  it("patches favorite state and removes unfavorited moments from the favorites view", () => {
    const favorite = {
      ...moment("fav", "2026-08-13T12:00:00.000Z"),
      isFavorite: true,
    };

    setTimelineView(emptyFilters, {
      items: [favorite],
      hasMore: false,
      nextCursor: null,
    });
    setTimelineView(favoriteFilters, {
      items: [favorite],
      hasMore: false,
      nextCursor: null,
    });

    patchCachedMomentFavorite("fav", false);

    expect(getTimelineView(emptyFilters)?.items[0]?.isFavorite).toBe(false);
    expect(getTimelineView(favoriteFilters)?.items).toEqual([]);
  });

  it("refetches only when nothing is remembered or a write just happened", () => {
    expect(shouldFetchFreshView(false)).toBe(true);
    expect(shouldFetchFreshView(true)).toBe(false);
    expect(shouldFetchFreshView(true, true)).toBe(true);
  });

  it("does not treat identical journal cards as a change", () => {
    const first = moment("m1", "2026-08-13T12:00:00.000Z");
    expect(didTimelineItemsChange([first], [first])).toBe(false);
    expect(
      didTimelineItemsChange(
        [first],
        [{ ...first, thumbnailUrl: "https://cdn.example/new.jpg" }],
      ),
    ).toBe(true);
  });
});
