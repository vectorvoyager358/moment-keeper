import { normalizeRelationItems } from "@/lib/moments/relations";

export type TimelineMoment = {
  id: string;
  body: string;
  occurred_at: string;
  tags: { id: string; name: string }[];
  hasMedia: boolean;
  mediaType: "photo" | "video" | "audio" | null;
  thumbnailPath: string | null;
  thumbnailUrl: string | null;
};

export type TimelineQueryRow = {
  id: string;
  body: string;
  occurred_at: string;
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
        thumbnail_path: string | null;
      }
    | {
        id: string;
        media_type: "photo" | "video" | "audio";
        thumbnail_path: string | null;
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

  const attachments = normalizeRelationItems(moment.media_attachments);
  const attachment = attachments[0] ?? null;

  return {
    id: moment.id,
    body: moment.body,
    occurred_at: moment.occurred_at,
    tags,
    hasMedia: Boolean(attachment),
    mediaType: attachment?.media_type ?? null,
    thumbnailPath: attachment?.thumbnail_path ?? null,
    thumbnailUrl,
  };
}
