import { afterEach, describe, expect, it, vi } from "vitest";

import { isAnalyticsEnabled } from "@/lib/analytics";

describe("isAnalyticsEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true when NEXT_PUBLIC_ANALYTICS_DISABLED is unset", () => {
    expect(isAnalyticsEnabled()).toBe(true);
  });

  it("returns false when NEXT_PUBLIC_ANALYTICS_DISABLED is true", () => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_DISABLED", "true");
    expect(isAnalyticsEnabled()).toBe(false);
  });
});
