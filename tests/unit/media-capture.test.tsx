import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const {
  isCameraSupported,
  isVideoCaptureSupported,
  openCameraStream,
  prefersNativeCamera,
} = vi.hoisted(() => ({
  isCameraSupported: vi.fn(() => true),
  isVideoCaptureSupported: vi.fn(() => true),
  openCameraStream: vi.fn(),
  prefersNativeCamera: vi.fn(() => false),
}));

vi.mock("@/lib/moments/camera-capture", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/moments/camera-capture")
  >("@/lib/moments/camera-capture");

  return {
    ...actual,
    isCameraSupported,
    isVideoCaptureSupported,
    openCameraStream,
    prefersNativeCamera,
  };
});

import { MediaCapture } from "@/components/capture/MediaCapture";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  document.body.style.overflow = "";
});

describe("MediaCapture", () => {
  it("offers photo and video capture entry points", () => {
    render(
      <MediaCapture
        onCameraActiveChange={vi.fn()}
        onCaptured={vi.fn()}
        onError={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Take photo/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Record video/i })).toBeVisible();
  });

  it("opens a full-screen camera overlay with flip and zoom controls", async () => {
    const track = {
      getCapabilities: () => ({}),
      applyConstraints: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
    };
    const stream = {
      getVideoTracks: () => [track],
      getTracks: () => [track],
    } as unknown as MediaStream;

    openCameraStream.mockResolvedValue(stream);
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);

    render(
      <MediaCapture
        onCameraActiveChange={vi.fn()}
        onCaptured={vi.fn()}
        onError={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Take photo/i }));

    expect(
      await screen.findByRole("button", { name: /Flip camera/i }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /Close camera/i })).toBeVisible();
    expect(screen.getByRole("slider", { name: /Zoom/i })).toBeVisible();
    expect(screen.getByText("Take a photo")).toBeVisible();
  });

  it("uses native phone camera inputs on mobile", () => {
    prefersNativeCamera.mockReturnValue(true);

    render(
      <MediaCapture
        onCameraActiveChange={vi.fn()}
        onCaptured={vi.fn()}
        onError={vi.fn()}
      />,
    );

    expect(screen.getByText(/Opens your phone's camera app/i)).toBeVisible();
    expect(
      screen.getByLabelText("Take photo with phone camera"),
    ).toHaveAttribute("capture", "environment");
    expect(openCameraStream).not.toHaveBeenCalled();
  });
});
