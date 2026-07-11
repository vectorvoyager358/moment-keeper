import { normalizeRelationItems } from "@/lib/moments/relations";

export type TimelineMoment = {
  id: string;
  body: string;
  occurred_at: string;
  isFavorite: boolean;
  tags: { id: string; name: string }[];
  hasMedia: boolean;
  attachmentCount: number;
  mediaType: "photo" | "video" | "audio" | null;
  thumbnailPath: string | null;
  thumbnailUrl: string | null;
  photoStoragePath: string | null;
  photoUrl: string | null;
};

export type TimelineQueryRow = {
  id: string;
  body: string;
  occurred_at: string;
  is_favorite: boolean;
  moment_tags:
    | {
        tags:
          | { id: string; name: string }
          | { id: string; name: string }[]
          | null;
      }[]
    | null;
  media_attachments:
    | {
        id: string;
        media_type: "photo" | "video" | "audio";
        storage_path?: string | null;
        thumbnail_path: string | null;
        display_order: number;
      }
    | {
        id: string;
        media_type: "photo" | "video" | "audio";
        storage_path?: string | null;
        thumbnail_path: string | null;
        display_order: number;
      }[]
    | null;
};

export function mapTimelineRow(
  moment: TimelineQueryRow,
  thumbnailUrl: string | null = null,
): TimelineMoment {
  const tags = (moment.moment_tags ?? []).flatMap((link) => {
    if (!link.tags) {
      return [];
    }

    return Array.isArray(link.tags) ? link.tags : [link.tags];
  });

  const attachments = normalizeRelationItems(moment.media_attachments).sort(
    (a, b) => a.display_order - b.display_order,
  );
  const attachment = attachments[0] ?? null;
  const primaryPhoto =
    attachments.find((item) => item.media_type === "photo") ?? null;
  const primaryVisual =
    attachments.find(
      (item) => item.media_type === "photo" && item.thumbnail_path,
    ) ??
    primaryPhoto ??
    attachment;

  return {
    id: moment.id,
    body: moment.body,
    occurred_at: moment.occurred_at,
    isFavorite: moment.is_favorite,
    tags,
    hasMedia: Boolean(attachment),
    attachmentCount: attachments.length,
    mediaType: attachment?.media_type ?? null,
    thumbnailPath: primaryVisual?.thumbnail_path ?? null,
    thumbnailUrl,
    photoStoragePath: primaryPhoto?.storage_path ?? null,
    photoUrl: null,
  };
}
