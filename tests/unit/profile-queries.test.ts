import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { getUserProfile } from "@/lib/profile/queries";

beforeEach(() => {
  createClientMock.mockReset();
});

describe("getUserProfile", () => {
  it("uses verified auth metadata without querying the profile table", async () => {
    const from = vi.fn();
    createClientMock.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: {
            claims: {
              sub: "user-1",
              email: "alex@example.com",
              user_metadata: { display_name: "  Alex   Kim  " },
            },
          },
        }),
      },
      from,
    });

    await expect(getUserProfile()).resolves.toEqual({
      email: "alex@example.com",
      displayName: "Alex Kim",
      hasDisplayName: true,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("falls back to the profile table for older account metadata", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { display_name: "Alex" },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    createClientMock.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: {
            claims: {
              sub: "user-1",
              email: "alex@example.com",
              user_metadata: {},
            },
          },
        }),
      },
      from,
    });

    await expect(getUserProfile()).resolves.toEqual({
      email: "alex@example.com",
      displayName: "Alex",
      hasDisplayName: true,
    });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("returns null when there are no authenticated claims", async () => {
    const from = vi.fn();
    createClientMock.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({ data: null }),
      },
      from,
    });

    await expect(getUserProfile()).resolves.toBeNull();
    expect(from).not.toHaveBeenCalled();
  });
});
