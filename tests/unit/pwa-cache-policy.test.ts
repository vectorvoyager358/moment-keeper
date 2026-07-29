import { describe, expect, it } from "vitest";

import {
  isSafeStaticAsset,
  LEGACY_RUNTIME_CACHE_NAMES,
  STATIC_ASSET_CACHE_NAME,
} from "@/lib/pwa/cache-policy";

describe("PWA cache policy", () => {
  it("allows only known same-origin static assets", () => {
    expect(isSafeStaticAsset(true, "/_next/static/chunks/app-abc123.js")).toBe(
      true,
    );

    expect(isSafeStaticAsset(false, "/_next/static/chunks/app-abc123.js")).toBe(
      false,
    );
    expect(isSafeStaticAsset(true, "/icons/icon-192.png")).toBe(false);
    expect(isSafeStaticAsset(true, "/manifest.webmanifest")).toBe(false);
    expect(isSafeStaticAsset(true, "/timeline")).toBe(false);
    expect(isSafeStaticAsset(true, "/moments/private-id")).toBe(false);
    expect(isSafeStaticAsset(true, "/api/moments")).toBe(false);
    expect(isSafeStaticAsset(true, "/_next/image")).toBe(false);
  });

  it("uses a distinct safe cache and removes legacy page caches", () => {
    expect(STATIC_ASSET_CACHE_NAME).toBe("moment-keeper-static-assets-v1");
    expect(LEGACY_RUNTIME_CACHE_NAMES).toEqual(
      expect.arrayContaining([
        "pages",
        "pages-rsc",
        "pages-rsc-prefetch",
        "cross-origin",
      ]),
    );
    expect(LEGACY_RUNTIME_CACHE_NAMES).not.toContain(STATIC_ASSET_CACHE_NAME);
  });
});
