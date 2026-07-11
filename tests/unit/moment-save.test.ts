import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  revalidatePath,
  removeMediaAttachmentsById,
  replaceMomentTags,
  uploadMediaFilesForMoment,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  revalidatePath: vi.fn(),
  removeMediaAttachmentsById: vi.fn(),
  replaceMomentTags: vi.fn(),
  uploadMediaFilesForMoment: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/lib/moments/repository", () => ({
  findOrCreateTagIds: vi.fn().mockResolvedValue([]),
  linkMomentTags: vi.fn(),
  replaceMomentTags,
}));
vi.mock("@/lib/moments/media-storage", () => ({
  removeMediaAttachmentsById,
  uploadMediaFilesForMoment,
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
    removeMediaAttachmentsById.mockReset().mockResolvedValue(undefined);
    replaceMomentTags.mockReset().mockResolvedValue(undefined);
    uploadMediaFilesForMoment.mockReset().mockResolvedValue(undefined);
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
      expect.objectContaining({
        themes: ["joy", "connection"],
        is_favorite: false,
      }),
    );
  });

  it("stores the favorite flag on a new moment", async () => {
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
    formData.set("favorite", "1");

    expect(await saveNewMoment(formData)).toEqual({
      ok: true,
      redirectTo: "/timeline?saved=1",
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ is_favorite: true }),
    );
  });

  it("uploads every media file attached to a new moment", async () => {
    const insert = vi.fn(() => ({
      select: () => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "moment-1" },
          error: null,
        }),
      }),
    }));
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn(() => ({ insert })),
    };
    createClientMock.mockResolvedValue(supabase);
    const formData = validFormData();
    const files = [
      new File(["one"], "one.jpg", { type: "image/jpeg" }),
      new File(["two"], "two.jpg", { type: "image/jpeg" }),
    ];
    files.forEach((file) => formData.append("media", file));

    expect(await saveNewMoment(formData)).toEqual({
      ok: true,
      redirectTo: "/timeline?saved=1",
    });
    expect(uploadMediaFilesForMoment).toHaveBeenCalledWith(
      supabase,
      "u1",
      "moment-1",
      files,
    );
  });

  it("clears themes when an edited moment has none selected", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) =>
        table === "media_attachments"
          ? {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                })),
              })),
            }
          : { update },
      ),
    });

    const result = await saveUpdatedMoment("moment-1", validFormData());

    expect(result.ok).toBe(true);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ themes: [], is_favorite: false }),
    );
  });

  it("updates the favorite flag when editing a moment", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) =>
        table === "media_attachments"
          ? {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                })),
              })),
            }
          : { update },
      ),
    });
    const formData = validFormData();
    formData.set("favorite", "1");

    expect(await saveUpdatedMoment("moment-1", formData)).toEqual({
      ok: true,
      redirectTo: "/moments/moment-1",
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ is_favorite: true }),
    );
  });

  it("removes selected media and fills the available attachment order", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) =>
        table === "media_attachments"
          ? {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      { id: "media-1", display_order: 0 },
                      { id: "media-2", display_order: 1 },
                    ],
                    error: null,
                  }),
                })),
              })),
            }
          : { update },
      ),
    };
    createClientMock.mockResolvedValue(supabase);
    const formData = validFormData();
    const newFile = new File(["new"], "new.jpg", { type: "image/jpeg" });
    formData.append("remove_media_id", "media-1");
    formData.append("media", newFile);

    expect(await saveUpdatedMoment("moment-1", formData)).toEqual({
      ok: true,
      redirectTo: "/moments/moment-1",
    });
    expect(removeMediaAttachmentsById).toHaveBeenCalledWith(
      supabase,
      "moment-1",
      ["media-1"],
    );
    expect(uploadMediaFilesForMoment).toHaveBeenCalledWith(
      supabase,
      "u1",
      "moment-1",
      [newFile],
      0,
      [0, 2, 3, 4],
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
