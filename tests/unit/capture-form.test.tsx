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
    onPreparedFileChange,
  }: {
    onPreparedFileChange: (file: File | null) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onPreparedFileChange(
          new File(["photo"], "camera.jpg", { type: "image/jpeg" }),
        )
      }
    >
      Attach generated photo
    </button>
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
      occurredAt: "2026-07-08T09:15",
      tags: "family",
      themes: ["joy"],
    });

    render(<CaptureForm userId="user-1" />);

    expect(await screen.findByDisplayValue("Restored memory")).toBeVisible();
    expect(screen.getByDisplayValue("2026-07-08T09:15")).toBeVisible();
    expect(screen.getByDisplayValue("family")).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Joy" })).toBeChecked();
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

    fireEvent.submit(screen.getByRole("button", { name: "Keep this moment" }));

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
    fireEvent.click(
      screen.getByRole("button", { name: "Attach generated photo" }),
    );
    fireEvent.submit(screen.getByRole("button", { name: "Keep this moment" }));

    await waitFor(() => {
      expect(postFormDataWithProgress).toHaveBeenCalled();
    });
    const formData = postFormDataWithProgress.mock.calls[0][1] as FormData;
    expect(formData.get("media")).toEqual(
      expect.objectContaining({ name: "camera.jpg", type: "image/jpeg" }),
    );
  });
});
