import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MomentAudioAttachments } from "@/components/moments/MomentAudioAttachments";
import type { MomentMedia } from "@/lib/moments/detail";

afterEach(cleanup);

const recordings: MomentMedia[] = [
  {
    id: "audio-1",
    media_type: "audio",
    mime_type: "audio/webm",
    original_filename: "first.webm",
    signedUrl: "https://example.com/first.webm",
    display_order: 0,
  },
  {
    id: "audio-2",
    media_type: "audio",
    mime_type: "audio/webm",
    original_filename: "second.webm",
    signedUrl: "https://example.com/second.webm",
    display_order: 1,
  },
];

describe("MomentAudioAttachments", () => {
  it("uses one button to reveal every voice recording", () => {
    const { container } = render(<MomentAudioAttachments media={recordings} />);

    expect(
      screen.getByRole("button", { name: "Open 2 voice recordings" }),
    ).toBeVisible();
    expect(container.querySelectorAll("audio")).toHaveLength(0);

    fireEvent.click(
      screen.getByRole("button", { name: "Open 2 voice recordings" }),
    );

    expect(screen.getByText("Voice recordings")).toBeVisible();
    expect(screen.queryByText("Voice recordings · 2")).not.toBeInTheDocument();
    expect(container.querySelectorAll("audio")).toHaveLength(2);
    expect(
      screen.getByLabelText("Voice recording 1: first.webm"),
    ).toHaveAttribute("src", "https://example.com/first.webm");
    expect(
      screen.getByLabelText("Voice recording 2: second.webm"),
    ).toHaveAttribute("src", "https://example.com/second.webm");
    expect(
      screen.getByRole("button", { name: "Download first.webm" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Download second.webm" }),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Close voice recordings" }),
    );

    expect(container.querySelectorAll("audio")).toHaveLength(0);
  });
});
