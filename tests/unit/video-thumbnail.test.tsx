import { cleanup, render, screen } from "@testing-library/react";
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
});
