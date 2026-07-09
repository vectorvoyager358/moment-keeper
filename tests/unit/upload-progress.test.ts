import { describe, expect, it } from "vitest";

import { uploadProgressPercent } from "@/lib/moments/upload-progress";

describe("uploadProgressPercent", () => {
  it("returns 0 when total is missing or zero", () => {
    expect(uploadProgressPercent(10, 0)).toBe(0);
    expect(uploadProgressPercent(10, Number.NaN)).toBe(0);
  });

  it("rounds loaded/total into a 0-100 percent", () => {
    expect(uploadProgressPercent(25, 100)).toBe(25);
    expect(uploadProgressPercent(1, 3)).toBe(33);
    expect(uploadProgressPercent(100, 100)).toBe(100);
  });

  it("clamps values outside 0-100", () => {
    expect(uploadProgressPercent(-10, 100)).toBe(0);
    expect(uploadProgressPercent(150, 100)).toBe(100);
  });
});
