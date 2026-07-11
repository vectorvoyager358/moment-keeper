import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TimelineMediaImage } from "@/components/timeline/TimelineMediaImage";

afterEach(cleanup);

describe("TimelineMediaImage", () => {
  it("falls back to the full photo when the thumbnail fails to load", () => {
    render(
      <TimelineMediaImage
        src="https://example.com/thumb.jpg"
        fallbackSrc="https://example.com/full.jpg"
        alt="Memory photo"
      />,
    );

    const image = screen.getByRole("img", { name: "Memory photo" });
    fireEvent.error(image);

    expect(image).toHaveAttribute("src", "https://example.com/full.jpg");
  });
});
