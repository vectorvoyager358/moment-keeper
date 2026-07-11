import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { getTimelineMoments } from "@/lib/moments/queries";

describe("getTimelineMoments keyword search", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("uses search_moment_ids RPC and preserves rank order", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        { id: "moment-2", rank: 0.9 },
        { id: "moment-1", rank: 0.4 },
      ],
      error: null,
    });

    const inFilter = vi.fn().mockResolvedValue({
      data: [
        {
          id: "moment-1",
          body: "A quiet walk",
          occurred_at: "2026-07-01T12:00:00.000Z",
          moment_tags: [],
          media_attachments: [],
        },
        {
          id: "moment-2",
          body: "Walked through the park",
          occurred_at: "2026-07-02T12:00:00.000Z",
          moment_tags: [],
          media_attachments: [],
        },
      ],
      error: null,
    });

    createClientMock.mockResolvedValue({
      rpc,
      from: vi.fn(() => ({
        select: () => ({
          in: inFilter,
        }),
      })),
      storage: {
        from: () => ({
          createSignedUrls: vi
            .fn()
            .mockResolvedValue({ data: [], error: null }),
        }),
      },
    });

    const result = await getTimelineMoments(
      { keyword: "walk", tagIds: [], favoriteOnly: true },
      { limit: 20, offset: 0 },
    );

    expect(rpc).toHaveBeenCalledWith("search_moment_ids", {
      p_query: "walk",
      p_tag_ids: null,
      p_limit: 21,
      p_offset: 0,
      p_favorite_only: true,
    });
    expect(result.items.map((item) => item.id)).toEqual([
      "moment-2",
      "moment-1",
    ]);
    expect(result.hasMore).toBe(false);
  });

  it("passes tag ids into the search RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    createClientMock.mockResolvedValue({
      rpc,
      from: vi.fn(),
    });

    const result = await getTimelineMoments({
      keyword: "park",
      tagIds: ["tag-1"],
      favoriteOnly: false,
    });

    expect(rpc).toHaveBeenCalledWith("search_moment_ids", {
      p_query: "park",
      p_tag_ids: ["tag-1"],
      p_limit: 21,
      p_offset: 0,
      p_favorite_only: false,
    });
    expect(result).toEqual({ items: [], hasMore: false });
  });
});
