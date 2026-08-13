import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loadMoreTimelineMoments, loadOnThisDayTimeline } = vi.hoisted(() => ({
  loadMoreTimelineMoments: vi.fn(),
  loadOnThisDayTimeline: vi.fn(),
}));

vi.mock("@/app/timeline/actions", () => ({
  loadMoreTimelineMoments,
  loadOnThisDayTimeline,
  loadTimelineTags: vi.fn().mockResolvedValue({ tags: [] }),
  loadResurfacedTimeline: vi.fn().mockResolvedValue({ moments: [] }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { JournalMoments } from "@/components/timeline/JournalMoments";
import { announceRestoredMoment } from "@/lib/moments/restore-event";
import type { TimelineMoment } from "@/lib/moments/timeline";
import {
  invalidateAllViewCaches,
  setOnThisDayView,
  setTimelineView,
} from "@/lib/moments/view-cache";

const filters = { keyword: "", tagIds: [], favoriteOnly: false };

const cachedMoment: TimelineMoment = {
  id: "cached-1",
  body: "Already on the page",
  occurred_at: "2026-08-13T12:00:00.000Z",
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

beforeEach(() => {
  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
  invalidateAllViewCaches();
  loadMoreTimelineMoments.mockReset().mockResolvedValue({
    items: [cachedMoment],
    hasMore: false,
    nextCursor: null,
  });
  loadOnThisDayTimeline.mockReset().mockResolvedValue({
    moments: [],
    todayIso: "2026-08-13T12:00:00.000Z",
    timeZone: "UTC",
  });
});

afterEach(cleanup);

describe("JournalMoments", () => {
  it("shows the remembered journal immediately without refetching", async () => {
    setOnThisDayView({
      moments: [],
      todayIso: "2026-08-13T12:00:00.000Z",
      timeZone: "UTC",
    });
    setTimelineView(filters, {
      items: [cachedMoment],
      hasMore: false,
      nextCursor: null,
    });

    render(
      <JournalMoments
        filters={filters}
        resurfacingFilters={{ themes: [], mediaType: null }}
        showSavedToast={false}
        showEmptySurprise={false}
        deletedMomentId={null}
      />,
    );

    expect(screen.getByText("Already on the page")).toBeVisible();
    expect(screen.queryByText("Loading moments")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(loadOnThisDayTimeline).not.toHaveBeenCalled();
    });
    expect(loadMoreTimelineMoments).not.toHaveBeenCalled();
  });

  it("loads the journal when nothing is remembered yet", async () => {
    render(
      <JournalMoments
        filters={filters}
        resurfacingFilters={{ themes: [], mediaType: null }}
        showSavedToast={false}
        showEmptySurprise={false}
        deletedMomentId={null}
      />,
    );

    expect(screen.getByText("Loading moments")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Already on the page")).toBeVisible();
    });
    expect(loadMoreTimelineMoments).toHaveBeenCalledWith(filters, {
      limit: 8,
    });
  });

  it("hides a deleted moment from the remembered journal", () => {
    setTimelineView(filters, {
      items: [
        cachedMoment,
        { ...cachedMoment, id: "deleted-1", body: "Should disappear" },
      ],
      hasMore: false,
      nextCursor: null,
    });

    render(
      <JournalMoments
        filters={filters}
        resurfacingFilters={{ themes: [], mediaType: null }}
        showSavedToast={false}
        showEmptySurprise={false}
        deletedMomentId="deleted-1"
      />,
    );

    expect(screen.getByText("Already on the page")).toBeVisible();
    expect(screen.queryByText("Should disappear")).not.toBeInTheDocument();
  });

  it("hides a deleted moment from the on-this-day preview", () => {
    setTimelineView(filters, {
      items: [cachedMoment],
      hasMore: false,
      nextCursor: null,
    });
    setOnThisDayView({
      moments: [
        {
          ...cachedMoment,
          id: "deleted-1",
          body: "From a previous year",
          occurred_at: "2025-08-13T12:00:00.000Z",
        },
      ],
      todayIso: "2026-08-13T12:00:00.000Z",
      timeZone: "UTC",
    });

    render(
      <JournalMoments
        filters={filters}
        resurfacingFilters={{ themes: [], mediaType: null }}
        showSavedToast={false}
        showEmptySurprise={false}
        deletedMomentId="deleted-1"
      />,
    );

    expect(screen.getByText("Already on the page")).toBeVisible();
    expect(screen.queryByText("From a previous year")).not.toBeInTheDocument();
  });

  it("puts an undone moment back in the on-this-day preview", async () => {
    const pastMoment = {
      ...cachedMoment,
      id: "deleted-1",
      body: "From a previous year",
      occurred_at: "2025-08-13T12:00:00.000Z",
    };

    setTimelineView(filters, {
      items: [cachedMoment],
      hasMore: false,
      nextCursor: null,
    });
    setOnThisDayView({
      moments: [pastMoment],
      todayIso: "2026-08-13T12:00:00.000Z",
      timeZone: "UTC",
    });

    render(
      <JournalMoments
        filters={filters}
        resurfacingFilters={{ themes: [], mediaType: null }}
        showSavedToast={false}
        showEmptySurprise={false}
        deletedMomentId="deleted-1"
      />,
    );

    expect(screen.queryByText("From a previous year")).not.toBeInTheDocument();

    act(() => {
      announceRestoredMoment(pastMoment);
    });

    const preview = await screen.findByRole("heading", {
      name: /On this day/i,
    });
    expect(preview.closest("section")).toHaveTextContent(
      "From a previous year",
    );
  });
});
