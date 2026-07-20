import { describe, expect, it } from "vitest";

import {
  buildTimelineCursorFilter,
  paginateItems,
  TIMELINE_PAGE_SIZE,
} from "@/lib/moments/pagination";

describe("paginateItems", () => {
  it("returns all items when within the page size", () => {
    expect(paginateItems(["a", "b", "c"], 5)).toEqual({
      items: ["a", "b", "c"],
      hasMore: false,
    });
  });

  it("trims to the page size and sets hasMore when extra items exist", () => {
    expect(paginateItems(["a", "b", "c", "d"], 3)).toEqual({
      items: ["a", "b", "c"],
      hasMore: true,
    });
  });

  it("uses the default timeline page size constant", () => {
    expect(TIMELINE_PAGE_SIZE).toBe(20);
  });

  it("builds a stable timestamp and id cursor filter", () => {
    expect(
      buildTimelineCursorFilter({
        occurredAt: "2026-07-19T12:00:00.000Z",
        id: "00000000-0000-4000-8000-000000000002",
      }),
    ).toBe(
      "occurred_at.lt.2026-07-19T12:00:00.000Z,and(occurred_at.eq.2026-07-19T12:00:00.000Z,id.lt.00000000-0000-4000-8000-000000000002)",
    );
  });
});
