import { describe, expect, it } from "vitest";

import {
  buildTimelineSearchUrl,
  getHighlightedSegments,
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
      favoriteOnly: false,
    });
  });

  it("dedupes repeated tag ids", () => {
    expect(parseSearchParams({ tag: ["tag-1", "tag-1"] })).toEqual({
      keyword: "",
      tagIds: ["tag-1"],
      favoriteOnly: false,
    });
  });

  it("parses the favorites-only filter", () => {
    expect(parseSearchParams({ favorite: "1" })).toEqual({
      keyword: "",
      tagIds: [],
      favoriteOnly: true,
    });
  });
});

describe("buildTimelineSearchUrl", () => {
  it("preserves keyword and repeated tag parameters", () => {
    expect(
      buildTimelineSearchUrl({
        keyword: "family trip",
        tagIds: ["tag-1", "tag-2"],
        favoriteOnly: true,
      }),
    ).toBe("/timeline?q=family+trip&tag=tag-1&tag=tag-2&favorite=1");
  });
});

describe("getHighlightedSegments", () => {
  it("marks keyword terms without changing their casing", () => {
    expect(
      getHighlightedSegments(
        "A Proud presentation today",
        "proud presentation",
      ),
    ).toEqual([
      { text: "A ", highlighted: false },
      { text: "Proud", highlighted: true },
      { text: " ", highlighted: false },
      { text: "presentation", highlighted: true },
      { text: " today", highlighted: false },
    ]);
  });
});

describe("hasActiveSearchFilters", () => {
  it("returns true when keyword or tags are present", () => {
    expect(
      hasActiveSearchFilters({
        keyword: "work",
        tagIds: [],
        favoriteOnly: false,
      }),
    ).toBe(true);
    expect(
      hasActiveSearchFilters({
        keyword: "",
        tagIds: ["tag-1"],
        favoriteOnly: false,
      }),
    ).toBe(true);
    expect(
      hasActiveSearchFilters({
        keyword: "",
        tagIds: [],
        favoriteOnly: true,
      }),
    ).toBe(true);
    expect(
      hasActiveSearchFilters({
        keyword: "",
        tagIds: [],
        favoriteOnly: false,
      }),
    ).toBe(false);
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
