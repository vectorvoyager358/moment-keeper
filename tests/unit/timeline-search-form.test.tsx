import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { TimelineSearchForm } from "@/components/timeline/TimelineSearchForm";

afterEach(cleanup);

describe("TimelineSearchForm active filters", () => {
  it("does not render a nested card when embedded in Find", () => {
    const { container } = render(
      <TimelineSearchForm
        filters={{ keyword: "", tagIds: [], favoriteOnly: false }}
        tags={[]}
        embedded
      />,
    );

    const fields = container.firstElementChild?.firstElementChild;
    expect(fields).toHaveClass("space-y-3");
    expect(fields).not.toHaveClass("ring-1", "shadow-card", "rounded-3xl");
  });

  beforeEach(() => {
    push.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("provides links to remove individual filters", () => {
    render(
      <TimelineSearchForm
        filters={{
          keyword: "presentation",
          tagIds: ["tag-1", "tag-2"],
          favoriteOnly: true,
        }}
        tags={[
          { id: "tag-1", name: "work", momentCount: 2 },
          { id: "tag-2", name: "proud", momentCount: 1 },
        ]}
      />,
    );

    expect(
      screen.getByRole("link", {
        name: "Remove keyword filter presentation",
      }),
    ).toHaveAttribute("href", "/timeline?tag=tag-1&tag=tag-2&favorite=1");
    expect(
      screen.getByRole("link", { name: "Remove tag filter work" }),
    ).toHaveAttribute("href", "/timeline?q=presentation&tag=tag-2&favorite=1");
    expect(
      screen.getByRole("link", { name: "Remove favorites filter" }),
    ).toHaveAttribute("href", "/timeline?q=presentation&tag=tag-1&tag=tag-2");
  });

  it("filters immediately when a tag is selected", () => {
    render(
      <TimelineSearchForm
        filters={{ keyword: "", tagIds: [], favoriteOnly: false }}
        tags={[{ id: "tag-1", name: "work", momentCount: 3 }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "work" }));

    expect(push).toHaveBeenCalledWith("/timeline?tag=tag-1", { scroll: false });
  });

  it("debounces keyword search without a Find button", () => {
    render(
      <TimelineSearchForm
        filters={{ keyword: "", tagIds: [], favoriteOnly: false }}
        tags={[]}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Find a moment" }), {
      target: { value: "sunset" },
    });

    expect(push).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(push).toHaveBeenCalledWith("/timeline?q=sunset", { scroll: false });
  });

  it("collapses long tag lists and offers a filter field", () => {
    const manyTags = Array.from({ length: 14 }, (_, index) => ({
      id: `tag-${index + 1}`,
      name: `tag-${index + 1}`,
      momentCount: 14 - index,
    }));

    render(
      <TimelineSearchForm
        filters={{ keyword: "", tagIds: [], favoriteOnly: false }}
        tags={manyTags}
      />,
    );

    expect(
      screen.getByRole("searchbox", { name: "Filter tags" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "tag-1" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "tag-14" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show 2 more tags" }),
    ).toBeVisible();
  });
});
