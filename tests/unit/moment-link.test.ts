import { describe, expect, it } from "vitest";

import {
  getMomentLinkHostname,
  MAX_MOMENT_LINK_URL_LENGTH,
  parseMomentLinkUrl,
} from "@/lib/moments/link";

describe("moment links", () => {
  it("treats an empty link as an omitted attachment", () => {
    expect(parseMomentLinkUrl("   ")).toEqual({ url: null, error: null });
  });

  it("adds https to a bare domain", () => {
    expect(parseMomentLinkUrl(" example.com/story ")).toEqual({
      url: "https://example.com/story",
      error: null,
    });
  });

  it("preserves valid HTTP and HTTPS webpage links", () => {
    expect(parseMomentLinkUrl("http://example.com/path?q=memory")).toEqual({
      url: "http://example.com/path?q=memory",
      error: null,
    });
    expect(parseMomentLinkUrl("https://example.com")).toEqual({
      url: "https://example.com/",
      error: null,
    });
  });

  it.each(["javascript:alert(1)", "file:///tmp/story", "mailto:a@b.com"])(
    "rejects the non-web scheme in %s",
    (value) => {
      expect(parseMomentLinkUrl(value)).toEqual({
        url: null,
        error: "Link must use http:// or https://.",
      });
    },
  );

  it("rejects malformed links and embedded credentials", () => {
    expect(parseMomentLinkUrl("https://not a domain.com").error).toBe(
      "Enter a valid webpage link.",
    );
    expect(parseMomentLinkUrl("https://user:pass@example.com").error).toBe(
      "Enter a valid webpage link.",
    );
  });

  it("limits stored links to a bounded length", () => {
    expect(
      parseMomentLinkUrl(
        `https://example.com/${"a".repeat(MAX_MOMENT_LINK_URL_LENGTH)}`,
      ).error,
    ).toContain("2,048 characters or fewer");
  });

  it("formats a concise hostname for display", () => {
    expect(getMomentLinkHostname("https://www.example.com/story")).toBe(
      "example.com",
    );
  });
});
