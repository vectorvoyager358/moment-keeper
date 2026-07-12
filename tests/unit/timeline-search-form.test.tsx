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
          { id: "tag-1", name: "work" },
          { id: "tag-2", name: "proud" },
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
        tags={[{ id: "tag-1", name: "work" }]}
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
});
