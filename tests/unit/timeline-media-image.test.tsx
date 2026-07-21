import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TimelineMediaImage } from "@/components/timeline/TimelineMediaImage";

afterEach(cleanup);

describe("TimelineMediaImage", () => {
  it("falls back to the full photo when the thumbnail fails to load", async () => {
    render(
      <TimelineMediaImage
        src="https://example.com/thumb.jpg"
        fallbackSrc="https://example.com/full.jpg"
        alt="Memory photo"
      />,
    );

    const thumbnail = await screen.findByRole("img", {
      name: "Memory photo",
    });
    fireEvent.error(thumbnail);

    const fallback = screen.getByRole("img", { name: "Memory photo" });
    expect(fallback).not.toBe(thumbnail);
    expect(fallback).toHaveAttribute("src", "https://example.com/full.jpg");
  });

  it("removes a broken image after every source fails", async () => {
    render(
      <TimelineMediaImage
        src="https://example.com/thumb.jpg"
        fallbackSrc="https://example.com/full.jpg"
        alt="Memory photo"
      />,
    );

    fireEvent.error(await screen.findByRole("img", { name: "Memory photo" }));
    fireEvent.error(screen.getByRole("img", { name: "Memory photo" }));

    expect(
      screen.queryByRole("img", { name: "Memory photo" }),
    ).not.toBeInTheDocument();
  });
});
