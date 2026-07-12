import { describe, expect, it } from "vitest";

import {
  getAuthRedirect,
  getSafeAuthCallbackRedirect,
  isAuthCallbackRoute,
  isPublicApiRoute,
  isPublicRoute,
  isPwaSupportRoute,
} from "@/lib/auth/routes";

describe("isPublicRoute", () => {
  it("returns true for landing and auth pages", () => {
    expect(isPublicRoute("/")).toBe(true);
    expect(isPublicRoute("/login")).toBe(true);
    expect(isPublicRoute("/signup")).toBe(true);
    expect(isPublicRoute("/forgot-password")).toBe(true);
  });

  it("returns false for protected routes", () => {
    expect(isPublicRoute("/timeline")).toBe(false);
    expect(isPublicRoute("/settings")).toBe(false);
    expect(isPublicRoute("/reset-password")).toBe(false);
  });
});

describe("isAuthCallbackRoute", () => {
  it("recognizes the PKCE callback path", () => {
    expect(isAuthCallbackRoute("/auth/callback")).toBe(true);
    expect(isAuthCallbackRoute("/auth/callback/")).toBe(true);
    expect(isAuthCallbackRoute("/auth/actions")).toBe(false);
  });
});

describe("isPublicApiRoute", () => {
  it("allows the health endpoint without auth", () => {
    expect(isPublicApiRoute("/api/health")).toBe(true);
    expect(isPublicApiRoute("/api/health/")).toBe(true);
    expect(isPublicApiRoute("/api/other")).toBe(false);
  });
});

describe("getSafeAuthCallbackRedirect", () => {
  it("allows the reset-password destination", () => {
    expect(getSafeAuthCallbackRedirect("/reset-password")).toBe(
      "/reset-password",
    );
  });

  it("falls back to timeline for unknown or external next values", () => {
    expect(getSafeAuthCallbackRedirect(null)).toBe("/timeline");
    expect(getSafeAuthCallbackRedirect("/settings")).toBe("/timeline");
    expect(getSafeAuthCallbackRedirect("https://evil.example")).toBe(
      "/timeline",
    );
  });
});

describe("isPwaSupportRoute", () => {
  it("recognizes service worker, manifest, and offline fallback routes", () => {
    expect(isPwaSupportRoute("/serwist/sw.js")).toBe(true);
    expect(isPwaSupportRoute("/manifest.webmanifest")).toBe(true);
    expect(isPwaSupportRoute("/~offline")).toBe(true);
    expect(isPwaSupportRoute("/timeline")).toBe(false);
  });
});

describe("getAuthRedirect", () => {
  it("redirects unauthenticated users to login", () => {
    expect(getAuthRedirect("/timeline", false)).toBe("/login");
    expect(getAuthRedirect("/reset-password", false)).toBe("/login");
  });

  it("redirects authenticated users away from public auth pages", () => {
    expect(getAuthRedirect("/", true)).toBe("/timeline");
    expect(getAuthRedirect("/login", true)).toBe("/timeline");
    expect(getAuthRedirect("/signup", true)).toBe("/timeline");
    expect(getAuthRedirect("/forgot-password", true)).toBe("/timeline");
  });

  it("does not redirect the auth callback or health routes", () => {
    expect(getAuthRedirect("/auth/callback", false)).toBeNull();
    expect(getAuthRedirect("/auth/callback", true)).toBeNull();
    expect(getAuthRedirect("/api/health", false)).toBeNull();
  });

  it("does not redirect PWA support routes", () => {
    expect(getAuthRedirect("/serwist/sw.js", false)).toBeNull();
    expect(getAuthRedirect("/manifest.webmanifest", true)).toBeNull();
    expect(getAuthRedirect("/~offline", false)).toBeNull();
    expect(getAuthRedirect("/~offline", true)).toBeNull();
  });

  it("allows authenticated users on reset-password", () => {
    expect(getAuthRedirect("/reset-password", true)).toBeNull();
  });

  it("allows unauthenticated users on the landing page", () => {
    expect(getAuthRedirect("/", false)).toBeNull();
  });

  it("returns null when no redirect is needed", () => {
    expect(getAuthRedirect("/timeline", true)).toBeNull();
    expect(getAuthRedirect("/login", false)).toBeNull();
    expect(getAuthRedirect("/forgot-password", false)).toBeNull();
  });
});
