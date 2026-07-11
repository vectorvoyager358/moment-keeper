import { describe, expect, it } from "vitest";

import { mapMomentDetailRow } from "@/lib/moments/detail";

describe("mapMomentDetailRow", () => {
  it("maps a text-only moment", () => {
    const result = mapMomentDetailRow(
      {
        id: "moment-1",
        body: "A proud moment.",
        occurred_at: "2026-07-07T12:00:00.000Z",
        themes: ["achievement"],
        moment_tags: [{ tags: { id: "tag-1", name: "work" } }],
        media_attachments: null,
      },
      null,
    );

    expect(result.media).toBeNull();
    expect(result.themes).toEqual(["achievement"]);
    expect(result.tags).toEqual([{ id: "tag-1", name: "work" }]);
  });

  it("includes signed media when available", () => {
    const result = mapMomentDetailRow(
      {
        id: "moment-2",
        body: "Photo moment.",
        occurred_at: "2026-07-07T12:00:00.000Z",
        themes: [],
        moment_tags: null,
        media_attachments: [
          {
            id: "media-1",
            media_type: "photo",
            mime_type: "image/jpeg",
            original_filename: "photo.jpg",
            storage_path: "user/moment/media-1.jpg",
          },
        ],
      },
      "https://example.com/signed",
    );

    expect(result.media).toEqual({
      id: "media-1",
      media_type: "photo",
      mime_type: "image/jpeg",
      original_filename: "photo.jpg",
      signedUrl: "https://example.com/signed",
    });
  });

  it("handles Supabase one-to-one media attachment objects", () => {
    const result = mapMomentDetailRow(
      {
        id: "moment-3",
        body: "Video moment.",
        occurred_at: "2026-07-07T12:00:00.000Z",
        themes: [],
        moment_tags: null,
        media_attachments: {
          id: "media-2",
          media_type: "video",
          mime_type: "video/mp4",
          original_filename: "clip.mp4",
          storage_path: "user/moment/media-2.mp4",
        },
      },
      "https://example.com/signed-video",
    );

    expect(result.media).toEqual({
      id: "media-2",
      media_type: "video",
      mime_type: "video/mp4",
      original_filename: "clip.mp4",
      signedUrl: "https://example.com/signed-video",
    });
  });
});
