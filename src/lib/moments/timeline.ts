import { normalizeRelationItems } from "@/lib/moments/relations";

export type TimelineMoment = {
  id: string;
  body: string;
  occurred_at: string;
  location: string | null;
  linkUrl: string | null;
  isFavorite: boolean;
  tags: { id: string; name: string }[];
  hasMedia: boolean;
  attachmentCount: number;
  mediaType: "photo" | "video" | "audio" | null;
  thumbnailPath: string | null;
  thumbnailUrl: string | null;
  photoStoragePath: string | null;
  photoUrl: string | null;
  videoStoragePath: string | null;
  videoUrl: string | null;
};

export type TimelineQueryRow = {
  id: string;
  body: string;
  occurred_at: string;
  location: string | null;
  link_url: string | null;
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

export function compareTimelineMoments(
  left: Pick<TimelineMoment, "id" | "occurred_at">,
  right: Pick<TimelineMoment, "id" | "occurred_at">,
): number {
  const occurredAtDifference = right.occurred_at.localeCompare(
    left.occurred_at,
  );
  return occurredAtDifference || right.id.localeCompare(left.id);
}

export function mergeTimelineMoments(
  current: TimelineMoment[],
  incoming: TimelineMoment[],
): TimelineMoment[] {
  const byId = new Map(current.map((moment) => [moment.id, moment]));

  for (const moment of incoming) {
    byId.set(moment.id, moment);
  }

  return [...byId.values()].sort(compareTimelineMoments);
}

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
  const primaryVisual =
    attachments.find(
      (item) => item.media_type === "photo" || item.media_type === "video",
    ) ?? attachment;
  const primaryPhoto =
    primaryVisual?.media_type === "photo" ? primaryVisual : null;
  const primaryVideo =
    primaryVisual?.media_type === "video" ? primaryVisual : null;

  return {
    id: moment.id,
    body: moment.body,
    occurred_at: moment.occurred_at,
    location: moment.location,
    linkUrl: moment.link_url,
    isFavorite: moment.is_favorite,
    tags,
    hasMedia: Boolean(attachment),
    attachmentCount: attachments.length,
    mediaType: primaryVisual?.media_type ?? null,
    thumbnailPath: primaryVisual?.thumbnail_path ?? null,
    thumbnailUrl,
    photoStoragePath: primaryPhoto?.storage_path ?? null,
    photoUrl: null,
    videoStoragePath: primaryVideo?.storage_path ?? null,
    videoUrl: null,
  };
}
