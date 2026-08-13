import { describe, expect, it } from "vitest";

import {
  formatOnThisDayHeading,
  getLocalCalendarParts,
  isOnThisDayMoment,
  yearsAgoLabel,
} from "@/lib/moments/on-this-day";

describe("getLocalCalendarParts", () => {
  it("returns calendar parts in the requested timezone", () => {
    expect(
      getLocalCalendarParts(
        new Date("2026-07-12T02:30:00.000Z"),
        "America/Chicago",
      ),
    ).toEqual({
      month: 7,
      day: 11,
      year: 2026,
    });
  });
});

describe("formatOnThisDayHeading", () => {
  it("formats the on-this-day heading in the viewer timezone", () => {
    expect(
      formatOnThisDayHeading(
        new Date("2026-07-12T02:30:00.000Z"),
        "America/Chicago",
      ),
    ).toBe("On this day · July 11");
  });
});

describe("isOnThisDayMoment", () => {
  it("matches the same calendar day in a previous year", () => {
    expect(
      isOnThisDayMoment(
        "2025-08-13T18:00:00.000Z",
        "2026-08-13T12:00:00.000Z",
        "UTC",
      ),
    ).toBe(true);
  });

  it("rejects this year and other calendar days", () => {
    expect(
      isOnThisDayMoment(
        "2026-08-13T12:00:00.000Z",
        "2026-08-13T12:00:00.000Z",
        "UTC",
      ),
    ).toBe(false);
    expect(
      isOnThisDayMoment(
        "2025-08-12T12:00:00.000Z",
        "2026-08-13T12:00:00.000Z",
        "UTC",
      ),
    ).toBe(false);
  });
});

describe("yearsAgoLabel", () => {
  const reference = new Date("2026-07-12T02:30:00.000Z");

  it("returns singular year label", () => {
    expect(
      yearsAgoLabel("2025-07-08T10:00:00.000Z", reference, "America/Chicago"),
    ).toBe("1 year ago");
  });

  it("returns plural year label", () => {
    expect(
      yearsAgoLabel("2023-07-08T10:00:00.000Z", reference, "America/Chicago"),
    ).toBe("3 years ago");
  });
});
