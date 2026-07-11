import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { getRandomMomentId } from "@/lib/moments/queries";

describe("getRandomMomentId", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    createClientMock.mockReset();
  });

  it("selects a random offset across all user moments", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.6);
    const range = vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "moment-3" },
        error: null,
      }),
    }));
    const from = vi
      .fn()
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ count: 4, error: null }),
      })
      .mockReturnValueOnce({
        select: () => ({
          order: () => ({ range }),
        }),
      });
    createClientMock.mockResolvedValue({ from });

    expect(await getRandomMomentId()).toBe("moment-3");
    expect(range).toHaveBeenCalledWith(2, 2);
  });

  it("returns null when the journal is empty", async () => {
    createClientMock.mockResolvedValue({
      from: () => ({
        select: vi.fn().mockResolvedValue({ count: 0, error: null }),
      }),
    });

    expect(await getRandomMomentId()).toBeNull();
  });
});
