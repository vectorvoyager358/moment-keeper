import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { getMomentPhotoFallbackUrl } from "@/lib/moments/media-fallback";

describe("getMomentPhotoFallbackUrl", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("signs the authenticated moment's first photo on demand", async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { storage_path: "user/moment/photo.jpg" },
        error: null,
      }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.limit.mockReturnValue(query);

    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: "https://media.example/photo.jpg" },
      error: null,
    });

    createClientMock.mockResolvedValue({
      from: vi.fn(() => query),
      storage: {
        from: vi.fn(() => ({ createSignedUrl })),
      },
    });

    await expect(getMomentPhotoFallbackUrl("moment-1")).resolves.toBe(
      "https://media.example/photo.jpg",
    );
    expect(query.eq).toHaveBeenNthCalledWith(1, "moment_id", "moment-1");
    expect(query.eq).toHaveBeenNthCalledWith(2, "media_type", "photo");
    expect(query.order).toHaveBeenCalledWith("display_order", {
      ascending: true,
    });
    expect(query.limit).toHaveBeenCalledWith(1);
    expect(createSignedUrl).toHaveBeenCalledWith("user/moment/photo.jpg", 3600);
  });

  it("does not sign anything when row-level security finds no photo", async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    const createSignedUrl = vi.fn();

    createClientMock.mockResolvedValue({
      from: vi.fn(() => query),
      storage: {
        from: vi.fn(() => ({ createSignedUrl })),
      },
    });

    await expect(getMomentPhotoFallbackUrl("missing")).resolves.toBeNull();
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
});
