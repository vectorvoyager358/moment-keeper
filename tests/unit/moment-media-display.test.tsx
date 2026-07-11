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

describe("MomentMediaDisplay", () => {
  it("opens a full-screen preview when a photo is clicked", () => {
    render(<MomentMediaDisplay media={photo} />);

    fireEvent.click(
      screen.getByRole("button", { name: "View photo full screen" }),
    );

    expect(
      screen.getAllByRole("button", { name: "Close photo preview" }),
    ).toHaveLength(2);
    expect(screen.getAllByRole("img", { name: "sunset.jpg" })).toHaveLength(2);
  });
});
