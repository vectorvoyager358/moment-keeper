import { describe, expect, it } from "vitest";

import {
  getCalendarPartsInTimeZone,
  getYearInTimeZone,
  localDateKey,
  normalizeTimeZone,
} from "@/lib/timezone";

describe("normalizeTimeZone", () => {
  it("accepts valid IANA timezones", () => {
    expect(normalizeTimeZone("America/Chicago")).toBe("America/Chicago");
  });

  it("falls back to UTC for invalid values", () => {
    expect(normalizeTimeZone("Not/AZone")).toBe("UTC");
    expect(normalizeTimeZone("")).toBe("UTC");
  });
});

describe("getCalendarPartsInTimeZone", () => {
  it("uses the viewer timezone instead of UTC", () => {
    expect(
      getCalendarPartsInTimeZone(
        new Date("2026-07-12T02:34:00.000Z"),
        "America/Chicago",
      ),
    ).toEqual({
      month: 7,
      day: 11,
      year: 2026,
    });
  });
});

describe("getYearInTimeZone", () => {
  it("reads the year in the requested timezone", () => {
    expect(
      getYearInTimeZone("2025-12-31T23:30:00.000Z", "America/Chicago"),
    ).toBe(2025);
  });
});

describe("localDateKey", () => {
  it("formats a local yyyy-mm-dd key", () => {
    expect(localDateKey(new Date(2026, 6, 11, 19, 34))).toBe("2026-07-11");
  });
});
