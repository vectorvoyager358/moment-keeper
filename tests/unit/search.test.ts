import { describe, expect, it } from "vitest";

import {
  hasActiveSearchFilters,
  orderByIds,
  parseSearchParams,
} from "@/lib/moments/search";

describe("parseSearchParams", () => {
  it("parses keyword and tag filters", () => {
    expect(
      parseSearchParams({
        q: " presentation ",
        tag: ["tag-1", "tag-2"],
      }),
    ).toEqual({
      keyword: "presentation",
      tagIds: ["tag-1", "tag-2"],
    });
  });

  it("dedupes repeated tag ids", () => {
    expect(parseSearchParams({ tag: ["tag-1", "tag-1"] })).toEqual({
      keyword: "",
      tagIds: ["tag-1"],
    });
  });
});

describe("hasActiveSearchFilters", () => {
  it("returns true when keyword or tags are present", () => {
    expect(hasActiveSearchFilters({ keyword: "work", tagIds: [] })).toBe(true);
    expect(hasActiveSearchFilters({ keyword: "", tagIds: ["tag-1"] })).toBe(
      true,
    );
    expect(hasActiveSearchFilters({ keyword: "", tagIds: [] })).toBe(false);
  });
});

describe("orderByIds", () => {
  it("reorders items to match ranked id order", () => {
    expect(
      orderByIds(
        [
          { id: "b", body: "second" },
          { id: "a", body: "first" },
        ],
        ["a", "b"],
      ),
    ).toEqual([
      { id: "a", body: "first" },
      { id: "b", body: "second" },
    ]);
  });

  it("skips missing ids", () => {
    expect(orderByIds([{ id: "a", body: "only" }], ["missing", "a"])).toEqual([
      { id: "a", body: "only" },
    ]);
  });
});
