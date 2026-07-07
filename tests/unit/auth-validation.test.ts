import { describe, expect, it } from "vitest";

import { validateAuthFields } from "@/lib/auth/validation";

describe("validateAuthFields", () => {
  it("rejects invalid email", () => {
    expect(validateAuthFields("not-an-email", "password123")).toBe(
      "Enter a valid email address.",
    );
  });

  it("rejects short passwords", () => {
    expect(validateAuthFields("user@example.com", "short")).toBe(
      "Password must be at least 8 characters.",
    );
  });

  it("accepts valid credentials", () => {
    expect(validateAuthFields("user@example.com", "password123")).toBeNull();
  });
});
