import { describe, expect, it } from "vitest";

import {
  extensionFromFile,
  getMediaTypeFromMime,
  MEDIA_SIZE_LIMITS,
  validateMediaFile,
} from "@/lib/moments/media";

function makeFile(name: string, type: string, size: number): File {
  const buffer = new Uint8Array(size);
  return new File([buffer], name, { type });
}

describe("getMediaTypeFromMime", () => {
  it("detects supported media types", () => {
    expect(getMediaTypeFromMime("image/jpeg")).toBe("photo");
    expect(getMediaTypeFromMime("video/mp4")).toBe("video");
    expect(getMediaTypeFromMime("audio/mpeg")).toBe("audio");
    expect(getMediaTypeFromMime("application/pdf")).toBeNull();
  });
});

describe("validateMediaFile", () => {
  it("rejects unsupported types", () => {
    const file = makeFile("notes.pdf", "application/pdf", 1024);
    expect(validateMediaFile(file)).toBe(
      "Unsupported file type. Use a photo, video, or audio file.",
    );
  });

  it("rejects files over the size limit", () => {
    const file = makeFile("big.jpg", "image/jpeg", MEDIA_SIZE_LIMITS.photo + 1);
    expect(validateMediaFile(file)).toBe(
      "File is too large. Max size for photo is 10 MB.",
    );
  });

  it("accepts valid files", () => {
    const file = makeFile("moment.jpg", "image/jpeg", 1024);
    expect(validateMediaFile(file)).toBeNull();
  });
});

describe("extensionFromFile", () => {
  it("uses the file extension when available", () => {
    expect(
      extensionFromFile({ name: "clip.MOV", type: "video/quicktime" }),
    ).toBe("mov");
  });

  it("falls back to mime type mapping", () => {
    expect(extensionFromFile({ name: "audio", type: "audio/mpeg" })).toBe(
      "mp3",
    );
  });
});
