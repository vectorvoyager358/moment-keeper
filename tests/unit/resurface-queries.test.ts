import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { getResurfacedMoments } from "@/lib/moments/queries";

describe("getResurfacedMoments", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("uses the resurfacing RPC and preserves its match order", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        { id: "moment-2", match_source: "theme", rank: 2 },
        { id: "moment-1", match_source: "content", rank: 0.5 },
      ],
      error: null,
    });
    const inFilter = vi.fn().mockResolvedValue({
      data: [
        {
          id: "moment-1",
          body: "I finally crossed the finish line",
          occurred_at: "2026-07-01T12:00:00.000Z",
          moment_tags: [],
          media_attachments: [],
        },
        {
          id: "moment-2",
          body: "A proud milestone",
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
        select: () => ({ is: () => ({ in: inFilter }) }),
      })),
      storage: {
        from: () => ({
          createSignedUrls: vi
            .fn()
            .mockResolvedValue({ data: [], error: null }),
        }),
      },
    });

    const result = await getResurfacedMoments(
      ["achievement", "growth"],
      "video",
    );

    expect(rpc).toHaveBeenCalledWith("resurface_moment_ids", {
      p_themes: ["achievement", "growth"],
      p_media_type: "video",
      p_limit: 6,
    });
    expect(result.map((moment) => moment.id)).toEqual(["moment-2", "moment-1"]);
  });

  it("does not query when no themes are selected", async () => {
    expect(await getResurfacedMoments([])).toEqual([]);
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
