import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { MomentMedia } from "@/lib/moments/detail";

import { MomentMediaDisplay } from "@/components/moments/MomentMediaDisplay";

afterEach(cleanup);

const photo: MomentMedia = {
  id: "media-1",
  media_type: "photo",
  mime_type: "image/jpeg",
  original_filename: "sunset.jpg",
  signedUrl: "https://example.com/sunset.jpg",
  display_order: 0,
};

const video: MomentMedia = {
  id: "media-2",
  media_type: "video",
  mime_type: "video/quicktime",
  original_filename: "memory.mov",
  signedUrl: "https://example.com/memory.mov",
  display_order: 0,
};

const audio: MomentMedia = {
  id: "media-3",
  media_type: "audio",
  mime_type: "audio/webm",
  original_filename: "voice-note.webm",
  signedUrl: "https://example.com/voice-note.webm",
  display_order: 0,
};

describe("MomentMediaDisplay", () => {
  it("constrains an inline photo to the mobile viewport", () => {
    render(<MomentMediaDisplay media={photo} />);

    expect(screen.getByRole("img", { name: "sunset.jpg" })).toHaveClass(
      "max-h-[46svh]",
      "object-contain",
    );
  });

  it("opens a full-screen preview when a photo is clicked", () => {
    const { container } = render(
      <MomentMediaDisplay media={photo} mode="viewer" />,
    );

    expect(container.querySelector('img[alt="sunset.jpg"]')).toHaveClass(
      "object-cover",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "View photo full screen" }),
    );

    expect(
      screen.getByRole("button", { name: "Download sunset.jpg" }),
    ).toBeVisible();
    expect(
      screen.getAllByRole("button", { name: "Close photo preview" }),
    ).toHaveLength(1);
    expect(screen.getAllByRole("img", { name: "sunset.jpg" })).toHaveLength(2);
  });

  it("fills the same immersive viewer before opening the original ratio", () => {
    const { container } = render(
      <MomentMediaDisplay media={video} mode="viewer" />,
    );

    const player = container.querySelector("video");

    expect(player).toHaveAttribute("playsinline");
    expect(player).toHaveClass("h-full", "object-cover");

    fireEvent.click(
      screen.getByRole("button", { name: "View video full screen" }),
    );
    expect(
      screen.getByRole("button", { name: "Download memory.mov" }),
    ).toBeVisible();
    expect(
      screen.getAllByRole("button", { name: "Close video preview" }),
    ).toHaveLength(1);
  });

  it("reveals audio playback only after the voice icon is clicked", () => {
    const { container } = render(<MomentMediaDisplay media={audio} />);

    expect(container.querySelector("audio")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open voice memo player for voice-note.webm",
      }),
    );

    expect(container.querySelector("audio")).toHaveAttribute(
      "src",
      "https://example.com/voice-note.webm",
    );
    expect(
      screen.getByLabelText("Voice memo player for voice-note.webm"),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Download voice-note.webm" }),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close voice memo player for voice-note.webm",
      }),
    );

    expect(container.querySelector("audio")).not.toBeInTheDocument();
  });
});
