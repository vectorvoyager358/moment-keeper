import { describe, expect, it } from "vitest";

import {
  normalizeRichTextDocument,
  parseRichTextFormData,
  plainTextToRichTextDocument,
  richTextToPlainText,
} from "@/lib/moments/rich-text";

describe("moment rich text", () => {
  it("keeps a searchable plain-text representation of formatted content", () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "A memorable day" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "We finally ", marks: [{ type: "italic" }] },
            { type: "text", text: "made it.", marks: [{ type: "bold" }] },
          ],
        },
      ],
    };
    const formData = new FormData();
    formData.set("body", "Tampered fallback");
    formData.set("body_content", JSON.stringify(content));

    expect(parseRichTextFormData(formData)).toEqual({
      error: null,
      body: "A memorable day\n\nWe finally made it.",
      content,
    });
  });

  it("rejects malformed documents instead of storing raw markup", () => {
    const formData = new FormData();
    formData.set("body", "Fallback");
    formData.set(
      "body_content",
      JSON.stringify({
        type: "doc",
        content: [{ type: "script", text: "alert(1)" }],
      }),
    );

    expect(parseRichTextFormData(formData)).toEqual({
      error: "Moment formatting could not be read. Please try again.",
      body: "",
      content: null,
    });
  });

  it("removes unsafe link marks while preserving their text", () => {
    const normalized = normalizeRichTextDocument({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Unsafe but readable",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    });

    expect(normalized).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Unsafe but readable" }],
        },
      ],
    });
  });

  it("converts legacy plain text into renderable paragraphs", () => {
    const document = plainTextToRichTextDocument("First line\nSecond line");

    expect(richTextToPlainText(document)).toBe("First line\n\nSecond line");
  });
});
