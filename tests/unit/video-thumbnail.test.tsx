import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { VideoThumbnail } from "@/components/moments/VideoThumbnail";

afterEach(cleanup);

describe("VideoThumbnail", () => {
  it("fills an overlay tile without conflicting relative positioning", () => {
    render(<VideoThumbnail src="https://example.com/memory.mp4" fill />);

    const thumbnail = screen.getByRole("img", { name: "Video thumbnail" });

    expect(thumbnail).toHaveClass("absolute", "inset-0", "h-full", "w-full");
    expect(thumbnail).not.toHaveClass("relative");
  });

  it("uses a generated poster without loading the full video", () => {
    const { container } = render(
      <VideoThumbnail
        src="https://example.com/memory.mp4"
        posterSrc="https://example.com/memory-poster.jpg"
      />,
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://example.com/memory-poster.jpg",
    );
    expect(container.querySelector("video")).not.toBeInTheDocument();
  });

  it("falls back to decoding the original video when its poster fails", async () => {
    const { container } = render(
      <VideoThumbnail
        src="https://example.com/memory.mp4"
        posterSrc="https://example.com/broken-poster.jpg"
      />,
    );

    const poster = container.querySelector("img");
    expect(poster).not.toBeNull();
    fireEvent.error(poster!);

    await waitFor(() => {
      expect(container.querySelector("video")).toHaveAttribute(
        "src",
        "https://example.com/memory.mp4",
      );
    });
    expect(container.querySelector("video")).toHaveAttribute("preload", "auto");
  });
});
