import { describe, expect, it } from "vitest";

import {
  buildCalendarDays,
  getCalendarMonthRange,
  parseCalendarParams,
  shiftCalendarMonth,
} from "@/lib/moments/calendar";

describe("calendar helpers", () => {
  it("parses a selected day within the requested month", () => {
    expect(
      parseCalendarParams(
        { year: "2026", month: "7", day: "2026-07-10" },
        new Date("2024-01-01T00:00:00.000Z"),
      ),
    ).toEqual({ year: 2026, month: 7, day: "2026-07-10" });
  });

  it("derives the month and year when jumping to an exact date", () => {
    expect(
      parseCalendarParams(
        { date: "1998-11-24" },
        new Date("2026-07-10T00:00:00.000Z"),
      ),
    ).toEqual({ year: 1998, month: 11, day: "1998-11-24" });
  });

  it("falls back to the current month and rejects invalid days", () => {
    expect(
      parseCalendarParams(
        { year: "invalid", month: "13", day: "2026-02-31" },
        new Date("2026-03-12T00:00:00.000Z"),
      ),
    ).toEqual({ year: 2026, month: 3, day: null });
  });

  it("builds a stable six-week Sunday-first month grid", () => {
    const days = buildCalendarDays({ year: 2026, month: 7 });

    expect(days).toHaveLength(42);
    expect(days[0]).toEqual({
      dateKey: "2026-06-28",
      dayNumber: 28,
      inMonth: false,
    });
    expect(days[41].dateKey).toBe("2026-08-08");
  });

  it("returns UTC month boundaries and shifts across years", () => {
    expect(getCalendarMonthRange({ year: 2026, month: 12 })).toEqual({
      start: "2026-12-01T00:00:00.000Z",
      end: "2027-01-01T00:00:00.000Z",
    });
    expect(shiftCalendarMonth({ year: 2026, month: 12 }, 1)).toEqual({
      year: 2027,
      month: 1,
    });
  });
});
