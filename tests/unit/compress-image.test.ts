import { describe, expect, it } from "vitest";

import {
  compressedImageName,
  formatFileSize,
  IMAGE_COMPRESS_MIN_BYTES,
  shouldCompressImage,
} from "@/lib/moments/compress-image";

describe("shouldCompressImage", () => {
  it("compresses large jpeg/png/webp photos", () => {
    expect(
      shouldCompressImage({
        type: "image/jpeg",
        size: IMAGE_COMPRESS_MIN_BYTES,
      }),
    ).toBe(true);
    expect(
      shouldCompressImage({
        type: "image/png",
        size: IMAGE_COMPRESS_MIN_BYTES,
      }),
    ).toBe(true);
  });

  it("skips small images, gifs, and non-photos", () => {
    expect(
      shouldCompressImage({
        type: "image/jpeg",
        size: IMAGE_COMPRESS_MIN_BYTES - 1,
      }),
    ).toBe(false);
    expect(
      shouldCompressImage({
        type: "image/gif",
        size: IMAGE_COMPRESS_MIN_BYTES,
      }),
    ).toBe(false);
    expect(
      shouldCompressImage({
        type: "video/mp4",
        size: IMAGE_COMPRESS_MIN_BYTES,
      }),
    ).toBe(false);
  });
});

describe("compressedImageName", () => {
  it("replaces the extension with jpg", () => {
    expect(compressedImageName("vacation.PNG")).toBe("vacation.jpg");
    expect(compressedImageName("photo")).toBe("photo.jpg");
  });
});

describe("formatFileSize", () => {
  it("formats bytes for display", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});
