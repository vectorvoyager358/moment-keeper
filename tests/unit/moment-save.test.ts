import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  registerDirectUploadedMedia,
  revalidatePath,
  removeDirectUploadedMedia,
  removeMediaAttachmentsById,
  reorderMediaAttachments,
  replaceMomentTags,
  uploadMediaFilesForMoment,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  registerDirectUploadedMedia: vi.fn(),
  revalidatePath: vi.fn(),
  removeDirectUploadedMedia: vi.fn(),
  removeMediaAttachmentsById: vi.fn(),
  reorderMediaAttachments: vi.fn(),
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
  registerDirectUploadedMedia,
  removeDirectUploadedMedia,
  removeMediaAttachmentsById,
  reorderMediaAttachments,
  uploadMediaFilesForMoment,
}));

import { saveNewMoment, saveUpdatedMoment } from "@/lib/moments/save";

function validFormData(): FormData {
  const formData = new FormData();
  formData.set("body", "A meaningful memory");
  formData.set("occurred_at", "2026-07-09T12:00");
  formData.set("occurred_at_offset", "300");
  formData.set("tags", "");
  return formData;
}

describe("moment theme saving", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    registerDirectUploadedMedia.mockReset().mockResolvedValue([]);
    revalidatePath.mockReset();
    removeDirectUploadedMedia.mockReset().mockResolvedValue(undefined);
    removeMediaAttachmentsById.mockReset().mockResolvedValue(undefined);
    reorderMediaAttachments.mockReset().mockResolvedValue(undefined);
    replaceMomentTags.mockReset().mockResolvedValue(undefined);
    uploadMediaFilesForMoment.mockReset().mockResolvedValue([]);
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

  it("stores structured formatting alongside searchable plain text", async () => {
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
    const bodyContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "A formatted memory",
              marks: [{ type: "bold" }],
            },
          ],
        },
      ],
    };
    formData.set("body_content", JSON.stringify(bodyContent));

    expect(await saveNewMoment(formData)).toEqual({
      ok: true,
      redirectTo: "/timeline?saved=1",
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "A formatted memory",
        body_content: bodyContent,
      }),
    );
  });

  it("stores occurred_at using the submitted timezone offset", async () => {
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

    await saveNewMoment(validFormData());

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        occurred_at: "2026-07-09T17:00:00.000Z",
      }),
    );
  });

  it("stores an optional location on a new moment", async () => {
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
    formData.set("location", " Central Park ");

    await saveNewMoment(formData);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ location: "Central Park" }),
    );
  });

  it("normalizes and stores an optional link on a new moment", async () => {
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
    formData.set("link_url", " example.com/story ");

    await saveNewMoment(formData);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ link_url: "https://example.com/story" }),
    );
  });

  it("rejects unsafe links before accessing the database", async () => {
    const formData = validFormData();
    formData.set("link_url", "javascript:alert(1)");

    expect(await saveNewMoment(formData)).toEqual({
      ok: false,
      error: "Link must use http:// or https://.",
      status: 400,
    });
    expect(createClientMock).not.toHaveBeenCalled();
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

  it("registers a directly uploaded MOV without proxying its bytes", async () => {
    const momentId = "11111111-1111-4111-8111-111111111111";
    const directUpload = {
      id: "22222222-2222-4222-8222-222222222222",
      clientIndex: 0,
      storagePath: `u1/${momentId}/22222222-2222-4222-8222-222222222222.mov`,
      thumbnailPath: `u1/${momentId}/22222222-2222-4222-8222-222222222222.thumb.jpg`,
      mimeType: "video/quicktime",
      fileSize: 5 * 1024 * 1024,
      originalFilename: "gallery-video.mov",
    };
    const insert = vi.fn(() => ({
      select: () => ({
        single: vi.fn().mockResolvedValue({
          data: { id: momentId },
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
    formData.set("moment_id", momentId);
    formData.set("direct_media", JSON.stringify([directUpload]));

    expect(await saveNewMoment(formData)).toEqual({
      ok: true,
      redirectTo: "/timeline?saved=1",
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: momentId }),
    );
    expect(registerDirectUploadedMedia).toHaveBeenCalledWith(
      supabase,
      "u1",
      momentId,
      [directUpload],
    );
    expect(uploadMediaFilesForMoment).not.toHaveBeenCalled();
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
      expect.objectContaining({
        themes: [],
        is_favorite: false,
        link_url: null,
      }),
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
      redirectTo: "/moments/moment-1?updated=1",
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
    uploadMediaFilesForMoment.mockResolvedValue(["media-new"]);
    const formData = validFormData();
    const newFile = new File(["new"], "new.jpg", { type: "image/jpeg" });
    formData.append("remove_media_id", "media-1");
    formData.append("media", newFile);

    expect(await saveUpdatedMoment("moment-1", formData)).toEqual({
      ok: true,
      redirectTo: "/moments/moment-1?updated=1",
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

  it("persists a mixed existing and newly uploaded attachment order", async () => {
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
    uploadMediaFilesForMoment.mockResolvedValue(["media-3"]);
    const formData = validFormData();
    const newFile = new File(["new"], "new.mp4", { type: "video/mp4" });
    formData.append("media", newFile);
    formData.append("media_order", "new:0");
    formData.append("media_order", "existing:media-2");
    formData.append("media_order", "existing:media-1");

    expect(await saveUpdatedMoment("moment-1", formData)).toEqual({
      ok: true,
      redirectTo: "/moments/moment-1?updated=1",
    });
    expect(reorderMediaAttachments).toHaveBeenCalledWith(supabase, "moment-1", [
      "media-3",
      "media-2",
      "media-1",
    ]);
  });

  it("registers a directly uploaded MOV when editing a moment", async () => {
    const momentId = "11111111-1111-4111-8111-111111111111";
    const mediaId = "22222222-2222-4222-8222-222222222222";
    const directUpload = {
      id: mediaId,
      clientIndex: 0,
      storagePath: `u1/${momentId}/${mediaId}.mov`,
      thumbnailPath: `u1/${momentId}/${mediaId}.thumb.jpg`,
      mimeType: "video/quicktime",
      fileSize: 5 * 1024 * 1024,
      originalFilename: "edited-memory.mov",
    };
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
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                })),
              })),
            }
          : { update },
      ),
    };
    createClientMock.mockResolvedValue(supabase);
    registerDirectUploadedMedia.mockResolvedValue([mediaId]);
    const formData = validFormData();
    formData.set("direct_media", JSON.stringify([directUpload]));
    formData.append("media_order", "new:0");

    expect(await saveUpdatedMoment(momentId, formData)).toEqual({
      ok: true,
      redirectTo: `/moments/${momentId}?updated=1`,
    });
    expect(registerDirectUploadedMedia).toHaveBeenCalledWith(
      supabase,
      "u1",
      momentId,
      [directUpload],
      [0],
    );
    expect(uploadMediaFilesForMoment).not.toHaveBeenCalled();
    expect(reorderMediaAttachments).toHaveBeenCalledWith(supabase, momentId, [
      mediaId,
    ]);
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
