import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MediaFileInput } from "@/components/capture/MediaFileInput";

vi.mock("@/components/capture/PhotoCapture", () => ({
  PhotoCapture: () => null,
}));

vi.mock("@/components/capture/VoiceMemoRecorder", () => ({
  VoiceMemoRecorder: () => null,
}));

describe("MediaFileInput", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:media-preview");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it("previews selected media and allows removing it", async () => {
    const onPreparedFileChange = vi.fn();
    const { container } = render(
      <MediaFileInput onPreparedFileChange={onPreparedFileChange} />,
    );
    const input = screen.getByLabelText(/Add a photo, video, or voice memo/);
    const file = new File(["voice"], "memory.webm", { type: "audio/webm" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(container.querySelector("audio")).toHaveAttribute(
        "src",
        "blob:media-preview",
      );
    });
    expect(screen.getByText("memory.webm")).toBeVisible();
    expect(onPreparedFileChange).toHaveBeenCalledWith(file);

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(container.querySelector("audio")).not.toBeInTheDocument();
    expect(onPreparedFileChange).toHaveBeenLastCalledWith(null);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:media-preview");
  });
});
