import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  onSaved,
  postFormDataWithProgress,
  push,
  refresh,
  removeDirectUploads,
  uploadVideosDirectly,
} = vi.hoisted(() => ({
  onSaved: vi.fn(),
  postFormDataWithProgress: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  removeDirectUploads: vi.fn(),
  uploadVideosDirectly: vi.fn(),
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
    <button
      type="button"
      onClick={() => {
        onPreparedFilesChange([
          new File(["video"], "edited-memory.mov", {
            type: "video/quicktime",
          }),
        ]);
        onPreparedThumbnailsChange?.([
          new File(["poster"], "edited-memory-poster.jpg", {
            type: "image/jpeg",
          }),
        ]);
      }}
    >
      Attach edited video
    </button>
  ),
}));

vi.mock("@/components/editor/RichTextEditor", () => ({
  RichTextEditor: ({ id, value }: { id: string; value: { text: string } }) => (
    <textarea id={id} aria-label="What happened?" value={value.text} readOnly />
  ),
}));

vi.mock("@/lib/moments/upload-progress", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/moments/upload-progress")>();
  return { ...original, postFormDataWithProgress };
});

vi.mock("@/lib/moments/direct-video-upload", () => ({
  removeDirectUploads,
  uploadVideosDirectly,
}));

import { EditMomentForm } from "@/components/moments/EditMomentForm";

describe("EditMomentForm media uploads", () => {
  beforeEach(() => {
    postFormDataWithProgress.mockReset().mockResolvedValue({
      redirectTo: "/moments/11111111-1111-4111-8111-111111111111?updated=1",
    });
    push.mockReset();
    refresh.mockReset();
    onSaved.mockReset();
    removeDirectUploads.mockReset().mockResolvedValue(undefined);
    uploadVideosDirectly.mockReset().mockResolvedValue([
      {
        id: "22222222-2222-4222-8222-222222222222",
        clientIndex: 0,
        storagePath:
          "user-1/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.mov",
        thumbnailPath:
          "user-1/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.thumb.jpg",
        mimeType: "video/quicktime",
        fileSize: 5,
        originalFilename: "edited-memory.mov",
      },
    ]);
  });

  afterEach(() => cleanup());

  it("uploads a new video directly instead of posting its bytes to Vercel", async () => {
    render(
      <EditMomentForm
        moment={{
          id: "11111111-1111-4111-8111-111111111111",
          body: "An existing memory",
          occurred_at: "2026-08-11T12:00:00.000Z",
          location: null,
          link_url: null,
          is_favorite: false,
          themes: [],
          tags: [],
          media: [],
        }}
        onCancel={vi.fn()}
        onSaved={onSaved}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Attach edited video" }),
    );
    fireEvent.submit(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(postFormDataWithProgress).toHaveBeenCalled());
    expect(uploadVideosDirectly).toHaveBeenCalledWith(
      expect.objectContaining({
        momentId: "11111111-1111-4111-8111-111111111111",
        videos: [
          expect.objectContaining({
            clientIndex: 0,
            file: expect.objectContaining({
              name: "edited-memory.mov",
              type: "video/quicktime",
            }),
          }),
        ],
      }),
    );

    const formData = postFormDataWithProgress.mock.calls[0][1] as FormData;
    expect(formData.get("media")).toBeNull();
    expect(JSON.parse(String(formData.get("direct_media")))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ originalFilename: "edited-memory.mov" }),
      ]),
    );
  });
});
