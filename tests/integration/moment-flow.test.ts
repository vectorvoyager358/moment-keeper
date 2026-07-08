import { describe, expect, it, vi } from "vitest";

import { findOrCreateTagIds, linkMomentTags } from "@/lib/moments/repository";
import {
  hasActiveSearchFilters,
  parseSearchParams,
} from "@/lib/moments/search";
import { mapTimelineRow } from "@/lib/moments/timeline";

describe("moment lifecycle integration", () => {
  it("links tags on create and exposes the moment to timeline search filters", async () => {
    const knownTags: { id: string; name: string }[] = [];
    let nextTagId = 1;

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "tags") {
          return {
            select: () => ({
              eq: async () => ({ data: knownTags, error: null }),
            }),
            insert: (row: { user_id: string; name: string }) => ({
              select: () => ({
                single: async () => {
                  const created = {
                    id: `tag-${nextTagId++}`,
                    name: row.name,
                  };
                  knownTags.push(created);
                  return { data: created, error: null };
                },
              }),
            }),
          };
        }

        if (table === "moment_tags") {
          return {
            insert: async () => ({ error: null }),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    const tagIds = await findOrCreateTagIds(supabase as never, "user-1", [
      "work",
      "proud moment",
    ]);

    await linkMomentTags(supabase as never, "moment-1", tagIds);

    const timelineMoment = mapTimelineRow({
      id: "moment-1",
      body: "Nailed the presentation today",
      occurred_at: "2026-07-07T12:00:00.000Z",
      moment_tags: [
        { tags: { id: tagIds[0], name: "work" } },
        { tags: { id: tagIds[1], name: "proud moment" } },
      ],
      media_attachments: [],
    });

    const filters = parseSearchParams({
      q: "presentation",
      tag: tagIds,
    });

    expect(hasActiveSearchFilters(filters)).toBe(true);
    expect(timelineMoment.body).toMatch(/presentation/i);
    expect(timelineMoment.tags.map((tag) => tag.name)).toEqual([
      "work",
      "proud moment",
    ]);
    expect(timelineMoment.hasMedia).toBe(false);
  });
});
