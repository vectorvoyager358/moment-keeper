import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import {
  getTimelineMoments,
  getUserMomentCount,
  getAdjacentMomentIds,
} from "@/lib/moments/queries";

describe("getTimelineMoments cursor pagination", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("orders tied timestamps by id and returns the next cursor", async () => {
    const query = {
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: "00000000-0000-4000-8000-000000000003",
            body: "Newest tied moment",
            occurred_at: "2026-07-19T12:00:00.000Z",
            location: null,
            is_favorite: false,
            moment_tags: [],
            media_attachments: [],
          },
          {
            id: "00000000-0000-4000-8000-000000000002",
            body: "Second tied moment",
            occurred_at: "2026-07-19T12:00:00.000Z",
            location: null,
            is_favorite: false,
            moment_tags: [],
            media_attachments: [],
          },
          {
            id: "00000000-0000-4000-8000-000000000001",
            body: "Extra moment",
            occurred_at: "2026-07-18T12:00:00.000Z",
            location: null,
            is_favorite: false,
            moment_tags: [],
            media_attachments: [],
          },
        ],
        error: null,
      }),
      or: vi.fn(),
      order: vi.fn(),
      is: vi.fn(),
    };
    query.is.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.or.mockReturnValue(query);

    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ select: () => query })),
      storage: {
        from: () => ({
          createSignedUrls: vi
            .fn()
            .mockResolvedValue({ data: [], error: null }),
        }),
      },
    });

    const result = await getTimelineMoments(
      { keyword: "", tagIds: [], favoriteOnly: false },
      {
        limit: 2,
        cursor: {
          occurredAt: "2026-07-20T12:00:00.000Z",
          id: "00000000-0000-4000-8000-000000000004",
        },
      },
    );

    expect(query.order).toHaveBeenNthCalledWith(1, "occurred_at", {
      ascending: false,
    });
    expect(query.order).toHaveBeenNthCalledWith(2, "id", {
      ascending: false,
    });
    expect(query.or).toHaveBeenCalledWith(
      "occurred_at.lt.2026-07-20T12:00:00.000Z,and(occurred_at.eq.2026-07-20T12:00:00.000Z,id.lt.00000000-0000-4000-8000-000000000004)",
    );
    expect(query.limit).toHaveBeenCalledWith(3);
    expect(result.items.map((moment) => moment.id)).toEqual([
      "00000000-0000-4000-8000-000000000003",
      "00000000-0000-4000-8000-000000000002",
    ]);
    expect(result.nextCursor).toEqual({
      occurredAt: "2026-07-19T12:00:00.000Z",
      id: "00000000-0000-4000-8000-000000000002",
    });
  });

  it("signs media only for moments included in the requested page", async () => {
    const createSignedUrls = vi.fn().mockImplementation(async (paths) => ({
      data: paths.map((path: string) => ({
        path,
        signedUrl: `https://media.example/${path}`,
      })),
      error: null,
    }));
    const makeMoment = (
      id: string,
      day: number,
      hasThumbnail: boolean = true,
    ) => ({
      id,
      body: id,
      occurred_at: `2026-07-${day.toString().padStart(2, "0")}T12:00:00.000Z`,
      location: null,
      is_favorite: false,
      moment_tags: [],
      media_attachments: [
        {
          id: `${id}-media`,
          media_type: "photo",
          storage_path: `${id}.jpg`,
          thumbnail_path: hasThumbnail ? `${id}.thumb.jpg` : null,
          display_order: 0,
        },
      ],
    });
    const query = {
      limit: vi.fn().mockResolvedValue({
        data: [
          makeMoment("moment-3", 3),
          makeMoment("moment-2", 2, false),
          makeMoment("moment-1", 1),
        ],
        error: null,
      }),
      order: vi.fn(),
      is: vi.fn(),
    };
    query.is.mockReturnValue(query);
    query.order.mockReturnValue(query);

    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ select: () => query })),
      storage: {
        from: () => ({
          createSignedUrls,
        }),
      },
    });

    const result = await getTimelineMoments(
      { keyword: "", tagIds: [], favoriteOnly: false },
      { limit: 2 },
    );

    expect(result.items.map((moment) => moment.id)).toEqual([
      "moment-3",
      "moment-2",
    ]);
    expect(result.hasMore).toBe(true);
    expect(createSignedUrls).toHaveBeenCalledTimes(1);
    expect(createSignedUrls).toHaveBeenCalledWith(
      ["moment-3.thumb.jpg", "moment-2.jpg"],
      3600,
    );
    expect(result.items[0].photoUrl).toBeNull();
    expect(result.items[1].photoUrl).toBe("https://media.example/moment-2.jpg");
  });

  it("signs both a video poster and its original fallback", async () => {
    const createSignedUrls = vi.fn().mockImplementation(async (paths) => ({
      data: paths.map((path: string) => ({
        path,
        signedUrl: `https://media.example/${path}`,
      })),
      error: null,
    }));
    const query = {
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: "moment-video",
            body: "A saved video",
            occurred_at: "2026-07-03T12:00:00.000Z",
            location: null,
            is_favorite: false,
            moment_tags: [],
            media_attachments: [
              {
                id: "video-attachment",
                media_type: "video",
                storage_path: "moment-video.mov",
                thumbnail_path: "moment-video.thumb.jpg",
                display_order: 0,
              },
            ],
          },
        ],
        error: null,
      }),
      order: vi.fn(),
      is: vi.fn(),
    };
    query.is.mockReturnValue(query);
    query.order.mockReturnValue(query);

    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ select: () => query })),
      storage: { from: () => ({ createSignedUrls }) },
    });

    const result = await getTimelineMoments(
      { keyword: "", tagIds: [], favoriteOnly: false },
      { limit: 1 },
    );

    expect(createSignedUrls).toHaveBeenCalledWith(
      ["moment-video.thumb.jpg", "moment-video.mov"],
      3600,
    );
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        thumbnailUrl: "https://media.example/moment-video.thumb.jpg",
        videoUrl: "https://media.example/moment-video.mov",
      }),
    );
  });
});

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
          is: () => ({ in: inFilter }),
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

  it("uses the search RPC for tag-only filters", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ id: "moment-3", rank: 0 }],
      error: null,
    });
    const inFilter = vi.fn().mockResolvedValue({
      data: [
        {
          id: "moment-3",
          body: "Tagged only",
          occurred_at: "2026-07-03T12:00:00.000Z",
          location: null,
          is_favorite: false,
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
          is: () => ({ in: inFilter }),
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

    const result = await getTimelineMoments({
      keyword: "",
      tagIds: ["tag-1"],
      favoriteOnly: false,
    });

    expect(rpc).toHaveBeenCalledWith("search_moment_ids", {
      p_query: "",
      p_tag_ids: ["tag-1"],
      p_limit: 21,
      p_offset: 0,
      p_favorite_only: false,
    });
    expect(result.items.map((item) => item.id)).toEqual(["moment-3"]);
  });
});

describe("getUserMomentCount", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("returns the authenticated user's moment count", async () => {
    const is = vi.fn().mockResolvedValue({ count: 3, error: null });
    const select = vi.fn(() => ({ is }));
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ select })),
    });

    await expect(getUserMomentCount()).resolves.toBe(3);
    expect(select).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
    expect(is).toHaveBeenCalledWith("deleted_at", null);
  });
});

describe("getAdjacentMomentIds", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("returns deterministic neighbors when timestamps are tied", async () => {
    const earlierQuery = {
      limit: vi.fn().mockResolvedValue({ data: [{ id: "earlier-1" }] }),
      or: vi.fn(),
      order: vi.fn(),
      is: vi.fn(),
    };
    const laterQuery = {
      limit: vi.fn().mockResolvedValue({ data: [{ id: "later-1" }] }),
      or: vi.fn(),
      order: vi.fn(),
      is: vi.fn(),
    };
    earlierQuery.or.mockReturnValue(earlierQuery);
    earlierQuery.order.mockReturnValue(earlierQuery);
    earlierQuery.is.mockReturnValue(earlierQuery);
    laterQuery.or.mockReturnValue(laterQuery);
    laterQuery.order.mockReturnValue(laterQuery);
    laterQuery.is.mockReturnValue(laterQuery);
    let adjacencyQueryIndex = 0;

    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table !== "moments") {
          throw new Error(`Unexpected table ${table}`);
        }

        return {
          select: vi.fn((columns: string) => {
            if (columns === "occurred_at") {
              return {
                eq: vi.fn(() => ({
                  is: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { occurred_at: "2026-07-09T12:00:00.000Z" },
                      error: null,
                    }),
                  })),
                })),
              };
            }

            return adjacencyQueryIndex++ === 0 ? earlierQuery : laterQuery;
          }),
        };
      }),
    });

    await expect(getAdjacentMomentIds("moment-1")).resolves.toEqual({
      earlierId: "earlier-1",
      laterId: "later-1",
    });
    expect(earlierQuery.or).toHaveBeenCalledWith(
      "occurred_at.lt.2026-07-09T12:00:00.000Z,and(occurred_at.eq.2026-07-09T12:00:00.000Z,id.lt.moment-1)",
    );
    expect(earlierQuery.order).toHaveBeenNthCalledWith(1, "occurred_at", {
      ascending: false,
    });
    expect(earlierQuery.order).toHaveBeenNthCalledWith(2, "id", {
      ascending: false,
    });
    expect(laterQuery.or).toHaveBeenCalledWith(
      "occurred_at.gt.2026-07-09T12:00:00.000Z,and(occurred_at.eq.2026-07-09T12:00:00.000Z,id.gt.moment-1)",
    );
    expect(laterQuery.order).toHaveBeenNthCalledWith(1, "occurred_at", {
      ascending: true,
    });
    expect(laterQuery.order).toHaveBeenNthCalledWith(2, "id", {
      ascending: true,
    });
  });
});
