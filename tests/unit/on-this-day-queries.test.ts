import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { getOnThisDayMoments } from "@/lib/moments/queries";

describe("getOnThisDayMoments", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("uses on_this_day_moment_ids RPC and preserves occurred_at order", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        { id: "moment-2", occurred_at: "2025-07-08T10:00:00.000Z" },
        { id: "moment-1", occurred_at: "2024-07-08T10:00:00.000Z" },
      ],
      error: null,
    });

    const inFilter = vi.fn().mockResolvedValue({
      data: [
        {
          id: "moment-1",
          body: "Older memory",
          occurred_at: "2024-07-08T10:00:00.000Z",
          moment_tags: [],
          media_attachments: [],
        },
        {
          id: "moment-2",
          body: "Recent memory",
          occurred_at: "2025-07-08T10:00:00.000Z",
          moment_tags: [],
          media_attachments: [],
        },
      ],
      error: null,
    });

    const from = vi.fn(() => ({
      select: vi.fn(() => ({
        in: inFilter,
      })),
    }));

    createClientMock.mockResolvedValue({
      rpc,
      from,
      storage: {
        from: vi.fn(() => ({
          createSignedUrls: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      },
    });

    const result = await getOnThisDayMoments(
      new Date("2026-07-08T12:00:00.000Z"),
    );

    expect(rpc).toHaveBeenCalledWith("on_this_day_moment_ids", {
      p_month: 7,
      p_day: 8,
      p_year: 2026,
      p_limit: 12,
    });
    expect(result.map((moment) => moment.id)).toEqual(["moment-2", "moment-1"]);
  });
});
