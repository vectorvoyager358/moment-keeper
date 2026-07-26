import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/moments/thumbnail-image", () => ({
  createPhotoThumbnailBuffer: vi
    .fn()
    .mockResolvedValue(Buffer.from("thumbnail")),
}));

import {
  reorderMediaAttachments,
  uploadMediaFilesForMoment,
} from "@/lib/moments/media-storage";

describe("uploadMediaFilesForMoment", () => {
  it("stores a gallery MOV with normalized QuickTime metadata", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      storage: {
        from: vi.fn(() => ({ upload })),
      },
      from: vi.fn(() => ({ insert })),
    };
    const file = new File(["video"], "iphone-video.MOV", { type: "" });

    await uploadMediaFilesForMoment(supabase as never, "user-1", "moment-1", [
      file,
    ]);

    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-1\/moment-1\/.+\.mov$/),
      file,
      expect.objectContaining({ contentType: "video/quicktime" }),
    );
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        media_type: "video",
        mime_type: "video/quicktime",
      }),
    );
  });

  it("stores a generated poster with a new video attachment", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      storage: {
        from: vi.fn(() => ({ upload })),
      },
      from: vi.fn(() => ({ insert })),
    };
    const video = new File(["video"], "clip.mp4", { type: "video/mp4" });
    const poster = {
      name: "clip-poster.jpg",
      type: "image/jpeg",
      size: 6,
      arrayBuffer: vi
        .fn()
        .mockResolvedValue(new TextEncoder().encode("poster").buffer),
    } as unknown as File;

    await uploadMediaFilesForMoment(
      supabase as never,
      "user-1",
      "moment-1",
      [video],
      0,
      undefined,
      [poster],
    );

    expect(upload).toHaveBeenCalledTimes(2);
    expect(upload).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\.thumb\.jpg$/),
      expect.any(Buffer),
      expect.objectContaining({ contentType: "image/jpeg" }),
    );
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        media_type: "video",
        thumbnail_path: expect.stringMatching(/\.thumb\.jpg$/),
      }),
    );
  });

  it("cleans up earlier uploads when a later file fails", async () => {
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: new Error("storage failed") });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const inFilter = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      storage: {
        from: vi.fn(() => ({ upload, remove })),
      },
      from: vi.fn(() => ({
        insert,
        delete: vi.fn(() => ({ in: inFilter })),
      })),
    };
    const files = [
      new File(["one"], "one.webm", { type: "audio/webm" }),
      new File(["two"], "two.webm", { type: "audio/webm" }),
    ];

    await expect(
      uploadMediaFilesForMoment(supabase as never, "user-1", "moment-1", files),
    ).rejects.toThrow("storage failed");

    expect(remove).toHaveBeenCalledWith([
      expect.stringMatching(/^user-1\/moment-1\/.+\.webm$/),
    ]);
    expect(inFilter).toHaveBeenCalledWith("id", [insert.mock.calls[0][0].id]);
  });
});

describe("reorderMediaAttachments", () => {
  it("sends the complete attachment order to the database", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });

    await reorderMediaAttachments({ rpc } as never, "moment-1", [
      "media-2",
      "media-1",
    ]);

    expect(rpc).toHaveBeenCalledWith("reorder_moment_media", {
      p_moment_id: "moment-1",
      p_attachment_ids: ["media-2", "media-1"],
    });
  });

  it("surfaces database reorder failures", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ error: new Error("reorder failed") });

    await expect(
      reorderMediaAttachments({ rpc } as never, "moment-1", [
        "media-2",
        "media-1",
      ]),
    ).rejects.toThrow("reorder failed");
  });
});
