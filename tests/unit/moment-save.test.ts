import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, revalidatePath, replaceMomentTags } = vi.hoisted(
  () => ({
    createClientMock: vi.fn(),
    revalidatePath: vi.fn(),
    replaceMomentTags: vi.fn(),
  }),
);

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/lib/moments/repository", () => ({
  findOrCreateTagIds: vi.fn().mockResolvedValue([]),
  linkMomentTags: vi.fn(),
  replaceMomentTags,
}));
vi.mock("@/lib/moments/media-storage", () => ({
  removeMediaAttachmentsForMoment: vi.fn(),
  replaceMediaForMoment: vi.fn(),
  uploadMediaForMoment: vi.fn(),
}));

import { saveNewMoment, saveUpdatedMoment } from "@/lib/moments/save";

function validFormData(): FormData {
  const formData = new FormData();
  formData.set("body", "A meaningful memory");
  formData.set("occurred_at", "2026-07-09T12:00");
  formData.set("tags", "");
  return formData;
}

describe("moment theme saving", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    revalidatePath.mockReset();
    replaceMomentTags.mockReset().mockResolvedValue(undefined);
  });

  it("stores selected themes on a new moment", async () => {
    const insert = vi.fn(() => ({
      select: () => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "moment-1" },
          error: null,
        }),
      }),
    }));
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn(() => ({ insert })),
    });
    const formData = validFormData();
    formData.append("theme", "joy");
    formData.append("theme", "connection");

    const result = await saveNewMoment(formData);

    expect(result.ok).toBe(true);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ themes: ["joy", "connection"] }),
    );
  });

  it("clears themes when an edited moment has none selected", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn(() => ({ update })),
    });

    const result = await saveUpdatedMoment("moment-1", validFormData());

    expect(result.ok).toBe(true);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ themes: [] }),
    );
  });

  it("rejects tampered theme values before accessing the database", async () => {
    const formData = validFormData();
    formData.append("theme", "not-a-theme");

    expect(await saveNewMoment(formData)).toEqual({
      ok: false,
      error: "Choose valid memory themes.",
      status: 400,
    });
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
