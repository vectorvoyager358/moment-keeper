import { describe, expect, it } from "vitest";

import { getHealthPayload } from "@/lib/health";

describe("getHealthPayload", () => {
  it("returns an ok payload with timestamp and config flag", () => {
    expect(
      getHealthPayload({
        supabaseConfigured: true,
        now: new Date("2026-07-08T12:00:00.000Z"),
      }),
    ).toEqual({
      status: "ok",
      timestamp: "2026-07-08T12:00:00.000Z",
      supabaseConfigured: true,
    });
  });

  it("reports when supabase env is missing", () => {
    expect(
      getHealthPayload({
        supabaseConfigured: false,
        now: new Date("2026-07-08T12:00:00.000Z"),
      }).supabaseConfigured,
    ).toBe(false);
  });
});
