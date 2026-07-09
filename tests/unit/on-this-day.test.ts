import { describe, expect, it } from "vitest";

import {
  formatOnThisDayHeading,
  getUtcCalendarParts,
  yearsAgoLabel,
} from "@/lib/moments/on-this-day";

describe("getUtcCalendarParts", () => {
  it("returns UTC month, day, and year", () => {
    expect(getUtcCalendarParts(new Date("2026-07-08T15:30:00.000Z"))).toEqual({
      month: 7,
      day: 8,
      year: 2026,
    });
  });
});

describe("formatOnThisDayHeading", () => {
  it("formats the on-this-day heading in UTC", () => {
    expect(formatOnThisDayHeading(new Date("2026-07-08T12:00:00.000Z"))).toBe(
      "On this day · July 8",
    );
  });
});

describe("yearsAgoLabel", () => {
  const reference = new Date("2026-07-08T12:00:00.000Z");

  it("returns singular year label", () => {
    expect(yearsAgoLabel("2025-07-08T10:00:00.000Z", reference)).toBe(
      "1 year ago",
    );
  });

  it("returns plural year label", () => {
    expect(yearsAgoLabel("2023-07-08T10:00:00.000Z", reference)).toBe(
      "3 years ago",
    );
  });
});
