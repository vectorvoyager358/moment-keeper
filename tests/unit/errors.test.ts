import { describe, expect, it } from "vitest";

import {
  isAuthExpiredError,
  isNetworkError,
  toUserErrorMessage,
} from "@/lib/errors";

describe("isAuthExpiredError", () => {
  it("detects jwt and session expiry errors", () => {
    expect(isAuthExpiredError({ message: "JWT expired", status: 401 })).toBe(
      true,
    );
    expect(isAuthExpiredError({ code: "PGRST301" })).toBe(true);
    expect(isAuthExpiredError({ message: "Invalid login credentials" })).toBe(
      false,
    );
  });
});

describe("isNetworkError", () => {
  it("detects fetch and network failures", () => {
    expect(isNetworkError({ message: "Failed to fetch" })).toBe(true);
    expect(
      isNetworkError({ message: "NetworkError when attempting fetch" }),
    ).toBe(true);
    expect(isNetworkError({ message: "permission denied" })).toBe(false);
  });
});

describe("toUserErrorMessage", () => {
  it("maps auth expiry to a login prompt", () => {
    expect(toUserErrorMessage({ message: "JWT expired", status: 401 })).toBe(
      "Your session expired. Please log in again.",
    );
  });

  it("maps network failures to a connection message", () => {
    expect(toUserErrorMessage({ message: "Failed to fetch" })).toBe(
      "Could not reach the server. Check your connection and try again.",
    );
  });

  it("returns user-facing validation messages unchanged", () => {
    expect(
      toUserErrorMessage(
        new Error("Unsupported file type. Use a photo, video, or audio file."),
      ),
    ).toBe("Unsupported file type. Use a photo, video, or audio file.");
  });

  it("hides raw database errors behind a fallback", () => {
    expect(toUserErrorMessage({ message: "PGRST116: no rows found" })).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
