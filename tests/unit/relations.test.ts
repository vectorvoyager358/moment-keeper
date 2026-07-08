import { describe, expect, it } from "vitest";

import { normalizeRelationItems } from "@/lib/moments/relations";

describe("normalizeRelationItems", () => {
  it("returns an empty array for nullish values", () => {
    expect(normalizeRelationItems(null)).toEqual([]);
    expect(normalizeRelationItems(undefined)).toEqual([]);
  });

  it("returns arrays unchanged", () => {
    expect(normalizeRelationItems([{ id: "1" }, { id: "2" }])).toEqual([
      { id: "1" },
      { id: "2" },
    ]);
  });

  it("wraps a single object in an array", () => {
    expect(normalizeRelationItems({ id: "media-1" })).toEqual([
      { id: "media-1" },
    ]);
  });
});
