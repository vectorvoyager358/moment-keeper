import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import {
  getCalendarMoments,
  getMediaGalleryMoments,
  MEDIA_GALLERY_LIMIT,
} from "@/lib/moments/queries";

function createClientWithBuilder(builder: Record<string, unknown>) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => builder),
    })),
    storage: {
      from: vi.fn(() => ({
        createSignedUrls: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
  };
}

describe("browse queries", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("loads moments inside the requested UTC calendar month", async () => {
    const builder: Record<string, ReturnType<typeof vi.fn>> = {};
    builder.gte = vi.fn(() => builder);
    builder.lt = vi.fn(() => builder);
    builder.order = vi.fn().mockResolvedValue({ data: [], error: null });
    createClientMock.mockResolvedValue(createClientWithBuilder(builder));

    await getCalendarMoments(2026, 7);

    expect(builder.gte).toHaveBeenCalledWith(
      "occurred_at",
      "2026-07-01T00:00:00.000Z",
    );
    expect(builder.lt).toHaveBeenCalledWith(
      "occurred_at",
      "2026-08-01T00:00:00.000Z",
    );
    expect(builder.order).toHaveBeenCalledWith("occurred_at", {
      ascending: true,
    });
  });

  it("filters and limits the media gallery", async () => {
    const builder: Record<string, ReturnType<typeof vi.fn>> = {};
    builder.eq = vi.fn(() => builder);
    builder.order = vi.fn(() => builder);
    builder.limit = vi.fn().mockResolvedValue({ data: [], error: null });
    createClientMock.mockResolvedValue(createClientWithBuilder(builder));

    await getMediaGalleryMoments("video");

    expect(builder.eq).toHaveBeenCalledWith(
      "media_attachments.media_type",
      "video",
    );
    expect(builder.order).toHaveBeenCalledWith("occurred_at", {
      ascending: false,
    });
    expect(builder.limit).toHaveBeenCalledWith(MEDIA_GALLERY_LIMIT);
  });

  it("returns one gallery item per attachment", async () => {
    const builder: Record<string, ReturnType<typeof vi.fn>> = {};
    builder.order = vi.fn(() => builder);
    builder.limit = vi.fn().mockResolvedValue({
      data: [
        {
          id: "moment-1",
          body: "A day away",
          occurred_at: "2026-07-10T12:00:00.000Z",
          moment_tags: [],
          media_attachments: [
            {
              id: "media-2",
              media_type: "video",
              storage_path: "user/video.mp4",
              thumbnail_path: null,
              display_order: 1,
            },
            {
              id: "media-1",
              media_type: "photo",
              storage_path: "user/photo.jpg",
              thumbnail_path: "user/photo.thumb.jpg",
              display_order: 0,
            },
          ],
        },
      ],
      error: null,
    });
    const client = createClientWithBuilder(builder);
    client.storage.from = vi.fn(() => ({
      createSignedUrls: vi.fn().mockResolvedValue({
        data: [
          {
            path: "user/photo.thumb.jpg",
            signedUrl: "https://example.com/photo-thumb.jpg",
          },
          {
            path: "user/photo.jpg",
            signedUrl: "https://example.com/photo.jpg",
          },
          {
            path: "user/video.mp4",
            signedUrl: "https://example.com/video.mp4",
          },
        ],
        error: null,
      }),
    }));
    createClientMock.mockResolvedValue(client);

    const result = await getMediaGalleryMoments();

    expect(result.map((item) => item.id)).toEqual(["media-1", "media-2"]);
    expect(result[0]).toEqual(
      expect.objectContaining({
        momentId: "moment-1",
        thumbnailUrl: "https://example.com/photo-thumb.jpg",
        photoUrl: "https://example.com/photo.jpg",
      }),
    );
    expect(result[1]).toEqual(
      expect.objectContaining({
        videoUrl: "https://example.com/video.mp4",
      }),
    );
  });

  it("retries a missing video URL without discarding the media card", async () => {
    const builder: Record<string, ReturnType<typeof vi.fn>> = {};
    builder.gte = vi.fn(() => builder);
    builder.lt = vi.fn(() => builder);
    builder.order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "moment-video",
          body: "A saved video",
          occurred_at: "2026-07-21T12:00:00.000Z",
          location: null,
          link_url: null,
          is_favorite: false,
          moment_tags: [],
          media_attachments: [
            {
              id: "video-1",
              media_type: "video",
              storage_path: "user/moment/video.mp4",
              thumbnail_path: null,
              display_order: 0,
            },
          ],
        },
      ],
      error: null,
    });
    const client = createClientWithBuilder(builder);
    client.storage.from = vi.fn(() => ({
      createSignedUrls: vi.fn().mockResolvedValue({
        data: null,
        error: new Error("one batch path failed"),
      }),
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: "https://example.com/recovered-video.mp4" },
        error: null,
      }),
    }));
    createClientMock.mockResolvedValue(client);

    const result = await getCalendarMoments(2026, 7);

    expect(result[0].videoUrl).toBe("https://example.com/recovered-video.mp4");
  });
});
