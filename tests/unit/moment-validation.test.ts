import { describe, expect, it } from "vitest";

import {
  MAX_MOMENT_BODY_LENGTH,
  normalizeTagName,
  validateMomentBody,
  validateTagName,
} from "@/lib/moments/validation";

describe("validateMomentBody", () => {
  it("rejects empty text", () => {
    expect(validateMomentBody("   ")).toBe("Moment text is required.");
  });

  it("rejects text over the database limit", () => {
    expect(validateMomentBody("a".repeat(MAX_MOMENT_BODY_LENGTH + 1))).toBe(
      `Moment text must be ${MAX_MOMENT_BODY_LENGTH} characters or fewer.`,
    );
  });

  it("accepts valid text", () => {
    expect(validateMomentBody("A proud moment today.")).toBeNull();
  });
});

describe("validateTagName", () => {
  it("rejects blank tag names", () => {
    expect(validateTagName("   ")).toBe("Tag name is required.");
  });

  it("accepts trimmed tag names", () => {
    expect(validateTagName(" family ")).toBeNull();
  });
});

describe("normalizeTagName", () => {
  it("trims whitespace", () => {
    expect(normalizeTagName("  work  ")).toBe("work");
  });
});
