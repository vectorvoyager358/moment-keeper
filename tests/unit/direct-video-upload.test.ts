import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, remove, upload } = vi.hoisted(() => ({
  createClient: vi.fn(),
  remove: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({ createClient }));

import { uploadVideosDirectly } from "@/lib/moments/direct-video-upload";

describe("uploadVideosDirectly", () => {
  beforeEach(() => {
    upload.mockReset().mockResolvedValue({ error: null });
    remove.mockReset().mockResolvedValue({ error: null });
    createClient.mockReset().mockReturnValue({
      storage: {
        from: vi.fn(() => ({ remove, upload })),
      },
    });
  });

  it("uploads a gallery MOV directly with its normalized QuickTime type", async () => {
    const video = new File(["gallery video"], "family-memory.MOV", {
      type: "",
    });
    const poster = new File(["poster"], "family-memory-poster.jpg", {
      type: "image/jpeg",
    });

    const result = await uploadVideosDirectly({
      userId: "user-1",
      momentId: "11111111-1111-4111-8111-111111111111",
      videos: [{ file: video, thumbnail: poster, clientIndex: 0 }],
    });

    expect(upload).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(
        /^user-1\/11111111-1111-4111-8111-111111111111\/.+\.mov$/,
      ),
      video,
      { contentType: "video/quicktime", upsert: false },
    );
    expect(upload).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\.thumb\.jpg$/),
      poster,
      { contentType: "image/jpeg", upsert: false },
    );
    expect(result).toEqual([
      expect.objectContaining({
        clientIndex: 0,
        mimeType: "video/quicktime",
        originalFilename: "family-memory.MOV",
        storagePath: expect.stringMatching(/\.mov$/),
        thumbnailPath: expect.stringMatching(/\.thumb\.jpg$/),
      }),
    ]);
  });

  it("cleans up a partially uploaded video when its poster fails", async () => {
    upload
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "poster failed" } });

    await expect(
      uploadVideosDirectly({
        userId: "user-1",
        momentId: "11111111-1111-4111-8111-111111111111",
        videos: [
          {
            file: new File(["video"], "memory.mov", {
              type: "video/quicktime",
            }),
            thumbnail: new File(["poster"], "poster.jpg", {
              type: "image/jpeg",
            }),
            clientIndex: 0,
          },
        ],
      }),
    ).rejects.toThrow("Could not upload memory.mov. poster failed");

    expect(remove).toHaveBeenCalledWith([expect.stringMatching(/\.mov$/)]);
  });
});
