import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loadMoreTimelineMoments } = vi.hoisted(() => ({
  loadMoreTimelineMoments: vi.fn(),
}));

vi.mock("@/app/timeline/actions", () => ({ loadMoreTimelineMoments }));

import { TimelineFeed } from "@/components/timeline/TimelineFeed";
import type { TimelineMoment } from "@/lib/moments/queries";

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
});
