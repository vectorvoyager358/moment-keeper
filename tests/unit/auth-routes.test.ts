import { describe, expect, it } from "vitest";

import { getAuthRedirect, isPublicRoute } from "@/lib/auth/routes";

describe("isPublicRoute", () => {
  it("returns true for login and signup", () => {
    expect(isPublicRoute("/login")).toBe(true);
    expect(isPublicRoute("/signup")).toBe(true);
  });

  it("returns false for protected routes", () => {
    expect(isPublicRoute("/timeline")).toBe(false);
    expect(isPublicRoute("/settings")).toBe(false);
  });
});

describe("getAuthRedirect", () => {
  it("redirects unauthenticated users to login", () => {
    expect(getAuthRedirect("/timeline", false)).toBe("/login");
  });

  it("redirects authenticated users away from auth pages", () => {
    expect(getAuthRedirect("/login", true)).toBe("/timeline");
    expect(getAuthRedirect("/signup", true)).toBe("/timeline");
  });

  it("returns null when no redirect is needed", () => {
    expect(getAuthRedirect("/timeline", true)).toBeNull();
    expect(getAuthRedirect("/login", false)).toBeNull();
  });
});
