import { describe, expect, it } from "vitest";

import {
  validateAuthFields,
  validateChangePassword,
  validateEmail,
  validateNewPassword,
  validatePassword,
  validateSignupFields,
} from "@/lib/auth/validation";

describe("validateEmail", () => {
  it("rejects invalid email", () => {
    expect(validateEmail("not-an-email")).toBe("Enter a valid email address.");
  });

  it("accepts a valid email", () => {
    expect(validateEmail("user@example.com")).toBeNull();
  });
});

describe("validatePassword", () => {
  it("rejects short passwords", () => {
    expect(validatePassword("short")).toBe(
      "Password must be at least 8 characters.",
    );
  });

  it("accepts a long enough password", () => {
    expect(validatePassword("password123")).toBeNull();
  });
});

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

describe("validateSignupFields", () => {
  it("requires a display name", () => {
    expect(validateSignupFields("   ", "user@example.com", "password123")).toBe(
      "Enter a name.",
    );
  });

  it("accepts valid signup details", () => {
    expect(
      validateSignupFields("Alex", "user@example.com", "password123"),
    ).toBeNull();
  });
});

describe("validateNewPassword", () => {
  it("rejects short passwords", () => {
    expect(validateNewPassword("short", "short")).toBe(
      "Password must be at least 8 characters.",
    );
  });

  it("rejects mismatched passwords", () => {
    expect(validateNewPassword("password123", "password456")).toBe(
      "Passwords do not match.",
    );
  });

  it("accepts matching passwords", () => {
    expect(validateNewPassword("password123", "password123")).toBeNull();
  });
});

describe("validateChangePassword", () => {
  it("requires the current password", () => {
    expect(validateChangePassword("short", "password123", "password123")).toBe(
      "Enter your current password.",
    );
  });

  it("rejects when the new password matches the current one", () => {
    expect(
      validateChangePassword("password123", "password123", "password123"),
    ).toBe("New password must be different from your current password.");
  });

  it("accepts a valid password change", () => {
    expect(
      validateChangePassword("password123", "password456", "password456"),
    ).toBeNull();
  });
});
