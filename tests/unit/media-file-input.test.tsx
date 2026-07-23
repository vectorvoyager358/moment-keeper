import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MediaFileInput } from "@/components/capture/MediaFileInput";

vi.mock("@/components/capture/MediaCapture", () => ({
  MediaCapture: () => null,
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
    const onPreparedFilesChange = vi.fn();
    const { container } = render(
      <MediaFileInput onPreparedFilesChange={onPreparedFilesChange} />,
    );
    const input = screen.getByLabelText(/Add from your device/);
    const file = new File(["voice"], "memory.webm", { type: "audio/webm" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(container.querySelector("audio")).toHaveAttribute(
        "src",
        "blob:media-preview",
      );
    });
    expect(screen.getByText(/memory\.webm/)).toBeVisible();
    expect(onPreparedFilesChange).toHaveBeenCalledWith([file]);

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(container.querySelector("audio")).not.toBeInTheDocument();
    expect(onPreparedFilesChange).toHaveBeenLastCalledWith([]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:media-preview");
  });

  it("keeps multiple selected files and removes them individually", async () => {
    const onPreparedFilesChange = vi.fn();
    render(<MediaFileInput onPreparedFilesChange={onPreparedFilesChange} />);
    const files = [
      new File(["one"], "one.webm", { type: "audio/webm" }),
      new File(["two"], "two.webm", { type: "audio/webm" }),
    ];

    fireEvent.change(screen.getByLabelText(/Add from your device/), {
      target: { files },
    });

    await waitFor(() => {
      expect(onPreparedFilesChange).toHaveBeenCalledWith(files);
    });
    expect(screen.getByText("2/5")).toBeVisible();

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    expect(onPreparedFilesChange).toHaveBeenLastCalledWith([files[1]]);
    expect(screen.getByText("1/5")).toBeVisible();
  });

  it("normalizes a MOV selected from a gallery without MIME metadata", async () => {
    const onPreparedFilesChange = vi.fn();
    render(<MediaFileInput onPreparedFilesChange={onPreparedFilesChange} />);
    const file = new File(["video"], "iphone-video.MOV", { type: "" });

    fireEvent.change(screen.getByLabelText(/Add from your device/), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onPreparedFilesChange).toHaveBeenCalled();
    });
    const prepared = onPreparedFilesChange.mock.calls.at(-1)?.[0]?.[0] as File;
    expect(prepared.name).toBe("iphone-video.MOV");
    expect(prepared.type).toBe("video/quicktime");
  });

  it("marks an existing attachment for selective removal", () => {
    const { container } = render(
      <MediaFileInput
        existingMedia={[
          {
            id: "media-1",
            media_type: "photo",
            original_filename: "kept.jpg",
          },
        ]}
        onPreparedFilesChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(
      container.querySelector('input[name="remove_media_id"]'),
    ).toHaveValue("media-1");
    expect(screen.getByText("0/5")).toBeVisible();
    expect(screen.getByRole("button", { name: "Undo" })).toBeVisible();
  });
});
