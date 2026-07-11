import { describe, expect, it, vi } from "vitest";

import {
  buildCameraPhotoFileName,
  buildCameraVideoFileName,
  clampZoom,
  formatRecordingDuration,
  formatZoomLabel,
  getZoomCapabilities,
  isCameraSupported,
  isVideoCaptureSupported,
  prefersNativeCamera,
  toggleFacingMode,
} from "@/lib/moments/camera-capture";

describe("isCameraSupported", () => {
  it("returns false when getUserMedia is unavailable", () => {
    vi.stubGlobal("navigator", {});

    expect(isCameraSupported()).toBe(false);
    expect(isVideoCaptureSupported()).toBe(false);

    vi.unstubAllGlobals();
  });
});

describe("buildCameraPhotoFileName", () => {
  it("creates a jpeg filename with a timestamp", () => {
    expect(buildCameraPhotoFileName()).toMatch(/^photo-.*\.jpg$/);
  });
});

describe("buildCameraVideoFileName", () => {
  it("creates a webm filename with a timestamp", () => {
    expect(buildCameraVideoFileName("video/webm")).toMatch(/^video-.*\.webm$/);
  });
});

describe("prefersNativeCamera", () => {
  it("returns false when matchMedia is unavailable", () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false }),
    });

    expect(prefersNativeCamera()).toBe(false);

    vi.unstubAllGlobals();
  });
});

describe("toggleFacingMode", () => {
  it("switches between front and back cameras", () => {
    expect(toggleFacingMode("environment")).toBe("user");
    expect(toggleFacingMode("user")).toBe("environment");
  });
});

describe("formatRecordingDuration", () => {
  it("formats elapsed milliseconds as mm:ss", () => {
    expect(formatRecordingDuration(65_000)).toBe("1:05");
  });
});

describe("zoom helpers", () => {
  it("falls back to visual zoom when hardware zoom is unavailable", () => {
    expect(getZoomCapabilities(null)).toEqual({
      min: 1,
      max: 3,
      step: 0.1,
      hardware: false,
    });
  });

  it("clamps zoom within the allowed range", () => {
    const capabilities = { min: 1, max: 3, step: 0.5, hardware: false };

    expect(clampZoom(4, capabilities)).toBe(3);
    expect(clampZoom(0.5, capabilities)).toBe(1);
    expect(clampZoom(2.2, capabilities)).toBe(2);
  });

  it("formats zoom labels for the slider", () => {
    expect(formatZoomLabel(1.5)).toBe("1.5x");
  });
});
