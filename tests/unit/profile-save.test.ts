import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { saveProfileDisplayName } from "@/lib/profile/save";

describe("saveProfileDisplayName", () => {
  it("refreshes the session after updating auth metadata", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "user-1" },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const refreshSession = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      auth: { updateUser, refreshSession },
      from,
    } as unknown as SupabaseClient;

    await expect(
      saveProfileDisplayName(supabase, "user-1", "alex@example.com", "Alex"),
    ).resolves.toEqual({ error: null });

    expect(updateUser).toHaveBeenCalledWith({
      data: { display_name: "Alex" },
    });
    expect(refreshSession).toHaveBeenCalledOnce();
    expect(updateUser.mock.invocationCallOrder[0]).toBeLessThan(
      refreshSession.mock.invocationCallOrder[0],
    );
  });
});
