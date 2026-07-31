import { describe, expect, it } from "vitest";

import { getMomentBackContext } from "@/lib/moments/navigation";

describe("moment return navigation", () => {
  it("preserves an exact Look Back browsing context", () => {
    const from =
      "/browse?view=calendar&year=2026&month=7&day=2026-07-19#selected-day";

    expect(getMomentBackContext(from)).toEqual({
      href: from,
      label: "Back to Look Back",
    });
  });

  it("rejects external and unrelated return paths", () => {
    expect(getMomentBackContext("https://example.com")).toEqual({
      href: "/timeline",
      label: "Back to your journal",
    });
    expect(getMomentBackContext("//example.com/browse")).toEqual({
      href: "/timeline",
      label: "Back to your journal",
    });
    expect(getMomentBackContext("/settings")).toEqual({
      href: "/timeline",
      label: "Back to your journal",
    });
  });
});
