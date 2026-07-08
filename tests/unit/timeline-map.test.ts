import { describe, expect, it } from "vitest";

import { mapTimelineRow } from "@/lib/moments/timeline";

describe("mapTimelineRow", () => {
  it("handles null nested relations from Supabase", () => {
    const result = mapTimelineRow({
      id: "moment-1",
      body: "A proud moment.",
      occurred_at: "2026-07-07T12:00:00.000Z",
      moment_tags: null,
      media_attachments: null,
    });

    expect(result).toEqual({
      id: "moment-1",
      body: "A proud moment.",
      occurred_at: "2026-07-07T12:00:00.000Z",
      tags: [],
      hasMedia: false,
    });
  });

  it("maps tags and media when present", () => {
    const result = mapTimelineRow({
      id: "moment-2",
      body: "Tagged moment.",
      occurred_at: "2026-07-07T13:00:00.000Z",
      moment_tags: [{ tags: { id: "tag-1", name: "work" } }],
      media_attachments: [{ id: "media-1" }],
    });

    expect(result.tags).toEqual([{ id: "tag-1", name: "work" }]);
    expect(result.hasMedia).toBe(true);
  });
});
