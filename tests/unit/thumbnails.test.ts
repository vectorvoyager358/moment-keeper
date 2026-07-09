import { describe, expect, it } from "vitest";

import {
  shouldGenerateThumbnail,
  thumbnailStoragePath,
} from "@/lib/moments/thumbnails";

describe("thumbnailStoragePath", () => {
  it("derives a sibling .thumb.jpg path", () => {
    expect(thumbnailStoragePath("user-1/moment-1/abc123.png")).toBe(
      "user-1/moment-1/abc123.thumb.jpg",
    );
  });
});

describe("shouldGenerateThumbnail", () => {
  it("only generates for common photo mime types", () => {
    expect(shouldGenerateThumbnail("photo", "image/jpeg")).toBe(true);
    expect(shouldGenerateThumbnail("photo", "image/png")).toBe(true);
    expect(shouldGenerateThumbnail("video", "video/mp4")).toBe(false);
    expect(shouldGenerateThumbnail("audio", "audio/mpeg")).toBe(false);
  });
});
