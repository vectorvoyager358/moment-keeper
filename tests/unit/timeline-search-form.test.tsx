import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TimelineSearchForm } from "@/components/timeline/TimelineSearchForm";

afterEach(cleanup);

describe("TimelineSearchForm active filters", () => {
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
});
