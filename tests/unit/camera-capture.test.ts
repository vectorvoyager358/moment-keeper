import { describe, expect, it, vi } from "vitest";

import {
  buildCameraPhotoFileName,
  isCameraSupported,
} from "@/lib/moments/camera-capture";

describe("isCameraSupported", () => {
  it("returns false when getUserMedia is unavailable", () => {
    vi.stubGlobal("navigator", {});

    expect(isCameraSupported()).toBe(false);

    vi.unstubAllGlobals();
  });
});

describe("buildCameraPhotoFileName", () => {
  it("creates a jpeg filename with a timestamp", () => {
    expect(buildCameraPhotoFileName()).toMatch(/^photo-.*\.jpg$/);
  });
});
