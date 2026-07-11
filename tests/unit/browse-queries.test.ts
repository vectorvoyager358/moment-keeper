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
              media_type: "audio",
              thumbnail_path: null,
              display_order: 1,
            },
            {
              id: "media-1",
              media_type: "photo",
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
            signedUrl: "https://example.com/photo.jpg",
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
        thumbnailUrl: "https://example.com/photo.jpg",
      }),
    );
  });
});
