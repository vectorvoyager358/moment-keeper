import { describe, expect, it } from "vitest";

import {
  extensionFromFile,
  getMediaFilesFromFormData,
  getMediaTypeFromMime,
  MAX_MEDIA_ATTACHMENTS,
  MEDIA_SIZE_LIMITS,
  validateMediaFile,
  validateMediaFiles,
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

  it("rejects audio over the size limit", () => {
    const file = makeFile(
      "long.mp3",
      "audio/mpeg",
      MEDIA_SIZE_LIMITS.audio + 1,
    );
    expect(validateMediaFile(file)).toBe(
      "File is too large. Max size for audio is 25 MB.",
    );
  });

  it("accepts valid files", () => {
    const file = makeFile("moment.jpg", "image/jpeg", 1024);
    expect(validateMediaFile(file)).toBeNull();
  });
});

describe("multiple media validation", () => {
  it("reads repeated media fields", () => {
    const formData = new FormData();
    const files = [
      makeFile("one.jpg", "image/jpeg", 10),
      makeFile("two.jpg", "image/jpeg", 10),
    ];
    files.forEach((file) => formData.append("media", file));

    expect(getMediaFilesFromFormData(formData)).toEqual(files);
  });

  it("enforces the attachment count across existing and new media", () => {
    const file = makeFile("new.jpg", "image/jpeg", 10);

    expect(validateMediaFiles([file], MAX_MEDIA_ATTACHMENTS)).toBe(
      "Keep up to 5 media attachments per moment.",
    );
  });

  it("rejects uploads over 50 MB combined", () => {
    const files = [
      { name: "one.mp4", type: "video/mp4", size: 30 * 1024 * 1024 },
      { name: "two.mp4", type: "video/mp4", size: 25 * 1024 * 1024 },
    ] as File[];

    expect(validateMediaFiles(files)).toBe(
      "Combined media upload must be 50 MB or less.",
    );
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
