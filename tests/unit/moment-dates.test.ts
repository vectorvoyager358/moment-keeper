import { describe, expect, it } from "vitest";

import {
  formatMomentDate,
  parseOccurredAtFormValue,
  truncateBody,
  validateOccurredAt,
} from "@/lib/moments/dates";

describe("validateOccurredAt", () => {
  it("rejects invalid dates", () => {
    expect(validateOccurredAt("not-a-date")).toBe(
      "Enter a valid date and time.",
    );
  });

  it("rejects dates too far in the future", () => {
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    expect(validateOccurredAt(future)).toBe(
      "Moment date cannot be more than 1 hour in the future.",
    );
  });

  it("accepts valid dates", () => {
    expect(validateOccurredAt(new Date().toISOString())).toBeNull();
  });
});

describe("truncateBody", () => {
  it("truncates long text with an ellipsis", () => {
    expect(truncateBody("a".repeat(200), 160)).toMatch(/…$/);
  });

  it("leaves short text unchanged", () => {
    expect(truncateBody("Short moment.")).toBe("Short moment.");
  });
});

describe("formatMomentDate", () => {
  it("formats an instant in the requested timezone", () => {
    const iso = "2026-07-09T12:00:00.000Z";

    expect(formatMomentDate(iso, "America/Chicago")).not.toBe(
      formatMomentDate(iso, "UTC"),
    );
  });
});

describe("parseOccurredAtFormValue", () => {
  it("converts datetime-local values using the browser timezone offset", () => {
    expect(parseOccurredAtFormValue("2026-07-11T12:54", 300)).toBe(
      "2026-07-11T17:54:00.000Z",
    );
  });

  it("keeps full ISO values intact", () => {
    expect(parseOccurredAtFormValue("2026-07-11T17:54:00.000Z")).toBe(
      "2026-07-11T17:54:00.000Z",
    );
  });
});
