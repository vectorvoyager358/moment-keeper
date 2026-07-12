import { describe, expect, it } from "vitest";

import {
  normalizeMomentLocation,
  parseLocationFormData,
  validateMomentLocation,
} from "@/lib/moments/location";

describe("normalizeMomentLocation", () => {
  it("trims and returns null for empty values", () => {
    expect(normalizeMomentLocation("  Central Park  ")).toBe("Central Park");
    expect(normalizeMomentLocation("   ")).toBeNull();
  });
});

describe("parseLocationFormData", () => {
  it("reads the location field from form data", () => {
    const formData = new FormData();
    formData.set("location", " Mom's kitchen ");

    expect(parseLocationFormData(formData)).toBe("Mom's kitchen");
  });
});

describe("validateMomentLocation", () => {
  it("accepts null and rejects overly long values", () => {
    expect(validateMomentLocation(null)).toBeNull();
    expect(validateMomentLocation("a".repeat(201))).toMatch(/200 characters/);
  });
});
