import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loadTimelineTags, loadResurfacedTimeline, loadOnThisDayTimeline } =
  vi.hoisted(() => ({
    loadTimelineTags: vi.fn(),
    loadResurfacedTimeline: vi.fn(),
    loadOnThisDayTimeline: vi.fn(),
  }));

vi.mock("@/app/timeline/actions", () => ({
  loadTimelineTags,
  loadResurfacedTimeline,
  loadOnThisDayTimeline,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import {
  DeferredOnThisDayPreview,
  DeferredTimelineSearch,
  TimelineOnThisDayProvider,
} from "@/components/timeline/DeferredTimelinePanels";
import { TimelineCollapsiblePanel } from "@/components/timeline/TimelineCollapsiblePanel";
import { announceRemovedTags } from "@/lib/moments/tag-events";

beforeEach(() => {
  sessionStorage.clear();
  loadTimelineTags.mockReset().mockResolvedValue({ tags: [] });
  loadResurfacedTimeline.mockReset();
  loadOnThisDayTimeline.mockReset().mockResolvedValue({
    moments: [],
    todayIso: "2026-08-13T12:00:00.000Z",
    timeZone: "UTC",
  });
});

afterEach(cleanup);

describe("deferred timeline panels", () => {
  it("does not request tags until Find is opened", async () => {
    render(
      <TimelineCollapsiblePanel panelId="find" title="Find">
        <DeferredTimelineSearch
          filters={{ keyword: "", tagIds: [], favoriteOnly: false }}
        />
      </TimelineCollapsiblePanel>,
    );

    expect(loadTimelineTags).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Find" }));

    await waitFor(() => {
      expect(loadTimelineTags).toHaveBeenCalledOnce();
    });
  });

  it("removes a newly orphaned tag from an open Find panel", async () => {
    loadTimelineTags.mockResolvedValue({
      tags: [
        { id: "tag-orphaned", name: "temporary", momentCount: 1 },
        { id: "tag-shared", name: "shared", momentCount: 2 },
      ],
    });

    render(
      <TimelineCollapsiblePanel panelId="find" title="Find">
        <DeferredTimelineSearch
          filters={{ keyword: "", tagIds: [], favoriteOnly: false }}
        />
      </TimelineCollapsiblePanel>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Find" }));
    expect(await screen.findByText("temporary")).toBeVisible();
    expect(screen.getByText("shared")).toBeVisible();

    announceRemovedTags(["tag-orphaned"]);

    await waitFor(() => {
      expect(screen.queryByText("temporary")).not.toBeInTheDocument();
    });
    expect(screen.getByText("shared")).toBeVisible();
  });

  it("shows every server-loaded on-this-day memory immediately", () => {
    const result = {
      moments: [
        {
          id: "memory-1",
          body: "First past memory",
          occurred_at: "2025-08-11T12:00:00.000Z",
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
        },
        {
          id: "memory-2",
          body: "Second past memory",
          occurred_at: "2024-08-11T12:00:00.000Z",
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
        },
      ],
      todayIso: "2026-08-11T12:00:00.000Z",
      timeZone: "America/Chicago",
    };

    render(
      <TimelineOnThisDayProvider result={result}>
        <DeferredOnThisDayPreview />
      </TimelineOnThisDayProvider>,
    );

    expect(screen.getByText("First past memory")).toBeVisible();
    expect(screen.getByText("Second past memory")).toBeVisible();
  });

  it("does not render an automatic preview when there are no past memories", () => {
    const result = {
      moments: [],
      todayIso: "2026-08-11T12:00:00.000Z",
      timeZone: "America/Chicago",
    };

    const { container } = render(
      <TimelineOnThisDayProvider result={result}>
        <DeferredOnThisDayPreview />
      </TimelineOnThisDayProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
