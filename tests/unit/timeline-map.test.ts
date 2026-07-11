import { describe, expect, it } from "vitest";

import { mapTimelineRow } from "@/lib/moments/timeline";

describe("mapTimelineRow", () => {
  it("handles null nested relations from Supabase", () => {
    const result = mapTimelineRow({
      id: "moment-1",
      body: "A proud moment.",
      occurred_at: "2026-07-07T12:00:00.000Z",
      is_favorite: false,
      moment_tags: null,
      media_attachments: null,
    });

    expect(result).toEqual({
      id: "moment-1",
      body: "A proud moment.",
      occurred_at: "2026-07-07T12:00:00.000Z",
      isFavorite: false,
      tags: [],
      hasMedia: false,
      attachmentCount: 0,
      mediaType: null,
      thumbnailPath: null,
      thumbnailUrl: null,
    });
  });

  it("maps tags and media when present", () => {
    const result = mapTimelineRow({
      id: "moment-2",
      body: "Tagged moment.",
      occurred_at: "2026-07-07T13:00:00.000Z",
      is_favorite: true,
      moment_tags: [{ tags: { id: "tag-1", name: "work" } }],
      media_attachments: [
        {
          id: "media-1",
          media_type: "photo",
          thumbnail_path: "user/m/a.thumb.jpg",
          display_order: 0,
        },
      ],
    });

    expect(result.tags).toEqual([{ id: "tag-1", name: "work" }]);
    expect(result.hasMedia).toBe(true);
    expect(result.isFavorite).toBe(true);
    expect(result.attachmentCount).toBe(1);
    expect(result.mediaType).toBe("photo");
    expect(result.thumbnailPath).toBe("user/m/a.thumb.jpg");
  });

  it("handles Supabase one-to-one media attachment objects", () => {
    const result = mapTimelineRow(
      {
        id: "moment-3",
        body: "Media moment.",
        occurred_at: "2026-07-07T14:00:00.000Z",
        is_favorite: false,
        moment_tags: null,
        media_attachments: {
          id: "media-2",
          media_type: "video",
          thumbnail_path: null,
          display_order: 0,
        },
      },
      null,
    );

    expect(result.hasMedia).toBe(true);
    expect(result.mediaType).toBe("video");
    expect(result.thumbnailUrl).toBeNull();
  });

  it("uses the first photo thumbnail while preserving attachment order", () => {
    const result = mapTimelineRow({
      id: "moment-4",
      body: "Mixed media.",
      occurred_at: "2026-07-07T15:00:00.000Z",
      is_favorite: false,
      moment_tags: [],
      media_attachments: [
        {
          id: "video-1",
          media_type: "video",
          thumbnail_path: null,
          display_order: 0,
        },
        {
          id: "photo-1",
          media_type: "photo",
          thumbnail_path: "user/m/photo.thumb.jpg",
          display_order: 1,
        },
      ],
    });

    expect(result.mediaType).toBe("video");
    expect(result.attachmentCount).toBe(2);
    expect(result.thumbnailPath).toBe("user/m/photo.thumb.jpg");
  });
});
