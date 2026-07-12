import { describe, expect, it } from "vitest";

import {
  compareTagsForPicker,
  filterTagsByQuery,
  hiddenTagCount,
  visibleTagsForPicker,
} from "@/lib/moments/tag-filter";

const tags = [
  { id: "1", name: "work", momentCount: 12 },
  { id: "2", name: "family", momentCount: 8 },
  { id: "3", name: "travel", momentCount: 3 },
  { id: "4", name: "friends", momentCount: 1 },
];

describe("filterTagsByQuery", () => {
  it("matches tag names case-insensitively", () => {
    expect(filterTagsByQuery(tags, "FAM")).toEqual([
      { id: "2", name: "family", momentCount: 8 },
    ]);
  });
});

describe("visibleTagsForPicker", () => {
  it("limits visible tags while keeping selected ones", () => {
    expect(
      visibleTagsForPicker(tags, ["4"], { limit: 2, expanded: false }),
    ).toEqual([
      { id: "1", name: "work", momentCount: 12 },
      { id: "2", name: "family", momentCount: 8 },
      { id: "4", name: "friends", momentCount: 1 },
    ]);
  });

  it("shows every tag when expanded", () => {
    expect(
      visibleTagsForPicker(tags, [], { limit: 2, expanded: true }),
    ).toEqual(tags);
  });
});

describe("hiddenTagCount", () => {
  it("returns the number of hidden tags", () => {
    expect(hiddenTagCount(10, 6)).toBe(4);
  });
});

describe("compareTagsForPicker", () => {
  it("sorts by usage count then name", () => {
    expect(
      [
        { id: "a", name: "zeta", momentCount: 1 },
        { id: "b", name: "alpha", momentCount: 5 },
        { id: "c", name: "beta", momentCount: 5 },
      ]
        .sort(compareTagsForPicker)
        .map((tag) => tag.name),
    ).toEqual(["alpha", "beta", "zeta"]);
  });
});
