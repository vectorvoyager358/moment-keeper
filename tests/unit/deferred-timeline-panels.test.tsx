import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loadTimelineTags, loadOnThisDayTimeline, loadResurfacedTimeline } =
  vi.hoisted(() => ({
    loadTimelineTags: vi.fn(),
    loadOnThisDayTimeline: vi.fn(),
    loadResurfacedTimeline: vi.fn(),
  }));

vi.mock("@/app/timeline/actions", () => ({
  loadTimelineTags,
  loadOnThisDayTimeline,
  loadResurfacedTimeline,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { DeferredTimelineSearch } from "@/components/timeline/DeferredTimelinePanels";
import { TimelineCollapsiblePanel } from "@/components/timeline/TimelineCollapsiblePanel";

beforeEach(() => {
  sessionStorage.clear();
  loadTimelineTags.mockReset().mockResolvedValue({ tags: [] });
  loadOnThisDayTimeline.mockReset();
  loadResurfacedTimeline.mockReset();
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
});
