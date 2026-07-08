import { describe, expect, it } from "vitest";

import { parseTagInput, formatTagInput } from "@/lib/moments/tags";

describe("parseTagInput", () => {
  it("splits comma-separated tags", () => {
    expect(parseTagInput("work, family")).toEqual(["work", "family"]);
  });

  it("trims whitespace around tags", () => {
    expect(parseTagInput(" work ,  family ")).toEqual(["work", "family"]);
  });

  it("dedupes case-insensitive duplicates", () => {
    expect(parseTagInput("Work, work, FAMILY")).toEqual(["Work", "FAMILY"]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseTagInput("   ,  ")).toEqual([]);
  });
});

describe("formatTagInput", () => {
  it("joins tag names for form defaults", () => {
    expect(formatTagInput([{ name: "work" }, { name: "family" }])).toBe(
      "work, family",
    );
  });
});
