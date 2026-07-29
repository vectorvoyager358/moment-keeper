import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CaptureForm } from "@/components/capture/CaptureForm";
import {
  readCaptureDraft,
  writeCaptureDraft,
} from "@/lib/moments/capture-draft";

const { postFormDataWithProgress, push, refresh } = vi.hoisted(() => ({
  postFormDataWithProgress: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/components/capture/MediaFileInput", () => ({
  MediaFileInput: ({
    onPreparedFilesChange,
    onPreparedThumbnailsChange,
  }: {
    onPreparedFilesChange: (files: File[]) => void;
    onPreparedThumbnailsChange?: (thumbnails: (File | null)[]) => void;
  }) => (
    <>
      <button
        type="button"
        onClick={() =>
          onPreparedFilesChange([
            new File(["photo"], "camera.jpg", { type: "image/jpeg" }),
          ])
        }
      >
        Attach generated photo
      </button>
      <button
        type="button"
        onClick={() => {
          onPreparedFilesChange([
            new File(["video"], "camera.mp4", { type: "video/mp4" }),
          ]);
          onPreparedThumbnailsChange?.([
            new File(["poster"], "camera-poster.jpg", {
              type: "image/jpeg",
            }),
          ]);
        }}
      >
        Attach generated video
      </button>
    </>
  ),
}));

vi.mock("@/components/editor/RichTextEditor", () => ({
  RichTextEditor: ({
    id,
    value,
    onChange,
  }: {
    id: string;
    value: { text: string };
    onChange: (value: {
      text: string;
      content: {
        type: "doc";
        content: Array<{
          type: "paragraph";
          content?: Array<{ type: "text"; text: string }>;
        }>;
      };
    }) => void;
  }) => (
    <textarea
      id={id}
      aria-label="What happened?"
      value={value.text}
      onChange={(event) => {
        const text = event.currentTarget.value;
        onChange({
          text,
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                ...(text ? { content: [{ type: "text" as const, text }] } : {}),
              },
            ],
          },
        });
      }}
    />
  ),
}));

vi.mock("@/lib/moments/upload-progress", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/moments/upload-progress")>();

  return { ...original, postFormDataWithProgress };
});

describe("CaptureForm drafts", () => {
  beforeEach(() => {
    localStorage.clear();
    postFormDataWithProgress.mockReset();
    push.mockReset();
    refresh.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("restores a saved draft for the current user", async () => {
    writeCaptureDraft("user-1", {
      body: "Restored memory",
      bodyContent: null,
      occurredAt: "2026-07-08T09:15",
      tags: "family",
      location: "Grandma's house",
      linkUrl: "https://example.com/family",
      themes: ["joy"],
      isFavorite: true,
    });

    render(<CaptureForm userId="user-1" />);

    expect(await screen.findByLabelText("What happened?")).toHaveValue(
      "Restored memory",
    );
    expect(screen.getByDisplayValue("2026-07-08T09:15")).toBeVisible();
    expect(screen.getByDisplayValue("family")).toBeVisible();
    expect(screen.getByDisplayValue("Grandma's house")).toBeVisible();
    expect(
      screen.getByDisplayValue("https://example.com/family"),
    ).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Joy" })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Remove from favorites" }),
    ).toBeChecked();
  });

  it("adds an optional reflection prompt to the entry", () => {
    render(<CaptureForm userId="user-1" />);

    fireEvent.click(
      screen.getByRole("button", { name: "What made you smile?" }),
    );

    expect(screen.getByLabelText("What happened?")).toHaveValue(
      "What made you smile?\n\n",
    );
  });

  it("saves edits locally and clears them after submission", async () => {
    postFormDataWithProgress.mockResolvedValue({ redirectTo: "/timeline" });
    render(<CaptureForm userId="user-1" />);

    fireEvent.change(screen.getByLabelText("What happened?"), {
      target: { value: "A draft memory" },
    });

    await waitFor(
      () => {
        expect(readCaptureDraft("user-1")?.body).toBe("A draft memory");
      },
      { timeout: 1_000 },
    );

    fireEvent.submit(
      screen.getByRole("button", { name: "Capture this moment" }),
    );

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/timeline");
    });
    expect(readCaptureDraft("user-1")).toBeNull();
  });

  it("submits a generated camera file without relying on the file input", async () => {
    postFormDataWithProgress.mockResolvedValue({ redirectTo: "/timeline" });
    render(<CaptureForm userId="user-1" />);

    fireEvent.change(screen.getByLabelText("What happened?"), {
      target: { value: "Captured on my phone" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add more" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Attach generated photo" }),
    );
    fireEvent.submit(
      screen.getByRole("button", { name: "Capture this moment" }),
    );

    await waitFor(() => {
      expect(postFormDataWithProgress).toHaveBeenCalled();
    });
    const formData = postFormDataWithProgress.mock.calls[0][1] as FormData;
    expect(formData.get("media")).toEqual(
      expect.objectContaining({ name: "camera.jpg", type: "image/jpeg" }),
    );
  });

  it("submits a generated poster alongside a new video", async () => {
    postFormDataWithProgress.mockResolvedValue({ redirectTo: "/timeline" });
    render(<CaptureForm userId="user-1" />);

    fireEvent.change(screen.getByLabelText("What happened?"), {
      target: { value: "A video memory" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add more" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Attach generated video" }),
    );
    fireEvent.submit(
      screen.getByRole("button", { name: "Capture this moment" }),
    );

    await waitFor(() => {
      expect(postFormDataWithProgress).toHaveBeenCalled();
    });
    const formData = postFormDataWithProgress.mock.calls[0][1] as FormData;
    expect(formData.get("media_thumbnail_index")).toBe("0");
    expect(formData.get("media_thumbnail")).toEqual(
      expect.objectContaining({
        name: "camera-poster.jpg",
        type: "image/jpeg",
      }),
    );
  });

  it("submits the favorite flag when marked during capture", async () => {
    postFormDataWithProgress.mockResolvedValue({ redirectTo: "/timeline" });
    render(<CaptureForm userId="user-1" />);

    fireEvent.change(screen.getByLabelText("What happened?"), {
      target: { value: "A special memory" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add more" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Add to favorites" }));
    fireEvent.submit(
      screen.getByRole("button", { name: "Capture this moment" }),
    );

    await waitFor(() => {
      expect(postFormDataWithProgress).toHaveBeenCalled();
    });
    const formData = postFormDataWithProgress.mock.calls[0][1] as FormData;
    expect(formData.get("favorite")).toBe("1");
  });

  it("normalizes a bare domain before submitting it", async () => {
    postFormDataWithProgress.mockResolvedValue({ redirectTo: "/timeline" });
    render(<CaptureForm userId="user-1" />);

    fireEvent.change(screen.getByLabelText("What happened?"), {
      target: { value: "A useful article" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add more" }));
    fireEvent.change(screen.getByLabelText("Link (optional)"), {
      target: { value: "example.com/article" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Capture this moment" }),
    );

    await waitFor(() => {
      expect(postFormDataWithProgress).toHaveBeenCalled();
    });
    const formData = postFormDataWithProgress.mock.calls[0][1] as FormData;
    expect(formData.get("link_url")).toBe("https://example.com/article");
  });

  it("keeps optional fields behind Add more until expanded", () => {
    render(<CaptureForm userId="user-1" />);

    expect(
      screen.getByRole("button", { name: "Capture this moment" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Add more" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByLabelText("When did it happen?")).not.toBeVisible();
    expect(
      screen.queryByText("Attach generated photo"),
    ).not.toBeInTheDocument();
  });

  it("reveals optional fields when Add more is opened", () => {
    render(<CaptureForm userId="user-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Add more" }));

    expect(screen.getByRole("button", { name: "Add more" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByLabelText("When did it happen?")).toBeVisible();
  });
});
