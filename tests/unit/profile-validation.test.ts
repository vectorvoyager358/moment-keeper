import { describe, expect, it } from "vitest";

import {
  formatProfileName,
  formatProfileNameForDisplay,
  hasProfileName,
  normalizeProfileName,
  validateProfileName,
} from "@/lib/profile/validation";

describe("normalizeProfileName", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeProfileName("  Alex   Kim  ")).toBe("Alex Kim");
  });
});

describe("validateProfileName", () => {
  it("requires a non-empty name", () => {
    expect(validateProfileName("   ")).toBe("Enter a name.");
  });

  it("rejects names that are too long", () => {
    expect(validateProfileName("a".repeat(21))).toMatch(/20 characters/);
  });

  it("accepts a valid name", () => {
    expect(validateProfileName("Alex")).toBeNull();
  });
});

describe("formatProfileName", () => {
  it("returns an empty string for nullish values", () => {
    expect(formatProfileName(null)).toBe("");
  });
});

describe("hasProfileName", () => {
  it("returns false for empty stored names", () => {
    expect(hasProfileName(null)).toBe(false);
    expect(hasProfileName("   ")).toBe(false);
  });

  it("returns true when a name is stored", () => {
    expect(hasProfileName("Vector")).toBe(true);
  });
});

describe("formatProfileNameForDisplay", () => {
  it("title-cases each word", () => {
    expect(formatProfileNameForDisplay("john doe")).toBe("John Doe");
    expect(formatProfileNameForDisplay("  alex   kim  ")).toBe("Alex Kim");
  });

  it("returns an empty string for blank input", () => {
    expect(formatProfileNameForDisplay("   ")).toBe("");
  });
});
