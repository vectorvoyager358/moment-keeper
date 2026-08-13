import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loadMoreTimelineMoments } = vi.hoisted(() => ({
  loadMoreTimelineMoments: vi.fn(),
}));

vi.mock("@/app/timeline/actions", () => ({ loadMoreTimelineMoments }));

import { TimelineFeed } from "@/components/timeline/TimelineFeed";
import type { TimelineMoment } from "@/lib/moments/queries";
import {
  announceRestoredMoment,
  MOMENT_RESTORED_EVENT,
} from "@/lib/moments/restore-event";

const firstMoment: TimelineMoment = {
  id: "moment-1",
  body: "First memory",
  occurred_at: "2026-07-19T12:00:00.000Z",
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

const secondMoment: TimelineMoment = {
  ...firstMoment,
  id: "moment-2",
  body: "Earlier memory",
};

let intersectionCallback: IntersectionObserverCallback;
const observe = vi.fn();
const disconnect = vi.fn();

beforeEach(() => {
  loadMoreTimelineMoments.mockReset();
  observe.mockReset();
  disconnect.mockReset();
  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn(function (callback: IntersectionObserverCallback) {
      intersectionCallback = callback;
      return { disconnect, observe, unobserve: vi.fn() };
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TimelineFeed", () => {
  it("receives an undo that finishes before the feed mounts", async () => {
    announceRestoredMoment({
      ...firstMoment,
      id: "moment-restored-before-mount",
      body: "Restored before mount",
    });

    render(
      <TimelineFeed
        initialMoments={[firstMoment]}
        initialHasMore={false}
        filters={{ keyword: "", tagIds: [], favoriteOnly: false }}
      />,
    );

    expect(await screen.findByText("Restored before mount")).toBeVisible();
  });

  it("replaces an empty journal after undoing its only moment", async () => {
    render(
      <TimelineFeed
        initialMoments={[]}
        initialHasMore={false}
        filters={{ keyword: "", tagIds: [], favoriteOnly: false }}
      />,
    );

    expect(screen.getByText("Your journal is waiting")).toBeVisible();

    act(() => {
      announceRestoredMoment({
        ...firstMoment,
        id: "only-restored-moment",
        body: "Only restored memory",
      });
    });

    expect(await screen.findByText("Only restored memory")).toBeVisible();
    expect(
      screen.queryByText("Your journal is waiting"),
    ).not.toBeInTheDocument();
  });

  it("restores an undone moment immediately in chronological order", () => {
    const newestMoment = {
      ...firstMoment,
      id: "moment-newest",
      body: "Newest memory",
      occurred_at: "2026-07-20T12:00:00.000Z",
    };
    const restoredMoment = {
      ...firstMoment,
      id: "moment-restored",
      body: "Restored memory",
      occurred_at: "2026-07-19T18:00:00.000Z",
    };

    render(
      <TimelineFeed
        initialMoments={[newestMoment, firstMoment]}
        initialHasMore={false}
        filters={{ keyword: "", tagIds: [], favoriteOnly: false }}
      />,
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent(MOMENT_RESTORED_EVENT, { detail: restoredMoment }),
      );
    });

    const momentTexts = screen
      .getAllByRole("link")
      .map((link) => link.textContent)
      .filter(Boolean);
    expect(momentTexts).toEqual([
      expect.stringContaining("Newest memory"),
      expect.stringContaining("Restored memory"),
      expect.stringContaining("First memory"),
    ]);
  });

  it("loads the next bounded page before the user reaches the end", async () => {
    loadMoreTimelineMoments.mockResolvedValue({
      items: [secondMoment],
      hasMore: false,
    });

    render(
      <TimelineFeed
        initialMoments={[firstMoment]}
        initialHasMore
        initialNextCursor={{
          occurredAt: firstMoment.occurred_at,
          id: firstMoment.id,
        }}
        filters={{ keyword: "", tagIds: [], favoriteOnly: false }}
      />,
    );

    expect(observe).toHaveBeenCalledOnce();

    act(() => {
      intersectionCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Earlier memory")).toBeVisible();
    });
    expect(loadMoreTimelineMoments).toHaveBeenCalledWith(
      { keyword: "", tagIds: [], favoriteOnly: false },
      {
        cursor: {
          occurredAt: firstMoment.occurred_at,
          id: firstMoment.id,
        },
      },
    );
  });

  it("keeps an undone moment in date order when an earlier page arrives late", async () => {
    let finishLoadMore: (value: {
      items: TimelineMoment[];
      hasMore: boolean;
    }) => void = () => {};
    loadMoreTimelineMoments.mockReturnValue(
      new Promise((resolve) => {
        finishLoadMore = resolve;
      }),
    );

    const newestMoment = {
      ...firstMoment,
      id: "moment-newest",
      body: "Newest memory",
      occurred_at: "2026-07-20T12:00:00.000Z",
    };
    const middleMoment = {
      ...firstMoment,
      id: "moment-middle",
      body: "Middle memory",
      occurred_at: "2026-07-19T18:00:00.000Z",
    };
    const restoredMoment = {
      ...firstMoment,
      id: "moment-restored",
      body: "Restored memory",
      occurred_at: "2026-07-19T06:00:00.000Z",
    };

    render(
      <TimelineFeed
        initialMoments={[newestMoment]}
        initialHasMore
        initialNextCursor={{
          occurredAt: newestMoment.occurred_at,
          id: newestMoment.id,
        }}
        filters={{ keyword: "", tagIds: [], favoriteOnly: false }}
      />,
    );

    act(() => {
      intersectionCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    act(() => {
      announceRestoredMoment(restoredMoment);
    });

    expect(screen.getByText("Restored memory")).toBeVisible();

    await act(async () => {
      finishLoadMore({
        items: [middleMoment],
        hasMore: false,
      });
    });

    const momentTexts = screen
      .getAllByRole("link")
      .map((link) => link.textContent)
      .filter(Boolean);
    expect(momentTexts).toEqual([
      expect.stringContaining("Newest memory"),
      expect.stringContaining("Middle memory"),
      expect.stringContaining("Restored memory"),
    ]);
  });
});
