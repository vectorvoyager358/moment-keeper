import { describe, expect, it } from "vitest";

import { paginateItems, TIMELINE_PAGE_SIZE } from "@/lib/moments/pagination";

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
});
