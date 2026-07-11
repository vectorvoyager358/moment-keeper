import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, revalidatePath } = vi.hoisted(() => ({
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { setMomentFavorite } from "@/app/moments/[id]/actions";

describe("setMomentFavorite", () => {
  beforeEach(() => {
    createClient.mockReset();
    revalidatePath.mockReset();
  });

  it("updates the favorite flag and revalidates memory views", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    createClient.mockResolvedValue({
      from: vi.fn(() => ({ update })),
    });

    expect(await setMomentFavorite("moment-1", true)).toEqual({ error: null });
    expect(update).toHaveBeenCalledWith({ is_favorite: true });
    expect(eq).toHaveBeenCalledWith("id", "moment-1");
    expect(revalidatePath).toHaveBeenCalledWith("/timeline");
    expect(revalidatePath).toHaveBeenCalledWith("/browse");
    expect(revalidatePath).not.toHaveBeenCalledWith("/moments/moment-1");
  });
});
