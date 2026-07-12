import type { MediaType, MemoryTheme } from "@/lib/database.types";
import { normalizeRelationItems } from "@/lib/moments/relations";

export type MomentMedia = {
  id: string;
  media_type: MediaType;
  mime_type: string;
  original_filename: string | null;
  signedUrl: string;
  display_order: number;
};

export type MomentDetail = {
  id: string;
  body: string;
  occurred_at: string;
  location: string | null;
  is_favorite: boolean;
  themes: MemoryTheme[];
  tags: { id: string; name: string }[];
  media: MomentMedia[];
};

type MomentDetailQueryRow = {
  id: string;
  body: string;
  occurred_at: string;
  location: string | null;
  is_favorite: boolean;
  themes: MemoryTheme[];
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
        media_type: MediaType;
        mime_type: string;
        original_filename: string | null;
        storage_path: string;
        display_order: number;
      }
    | {
        id: string;
        media_type: MediaType;
        mime_type: string;
        original_filename: string | null;
        storage_path: string;
        display_order: number;
      }[]
    | null;
};

export function extractTags(
  momentTags: MomentDetailQueryRow["moment_tags"],
): { id: string; name: string }[] {
  return (momentTags ?? []).flatMap((link) => {
    if (!link.tags) {
      return [];
    }

    return Array.isArray(link.tags) ? link.tags : [link.tags];
  });
}

export function mapMomentDetailRow(
  moment: MomentDetailQueryRow,
  signedUrlByPath: Map<string, string> = new Map(),
): MomentDetail {
  const attachments = normalizeRelationItems(moment.media_attachments).sort(
    (a, b) => a.display_order - b.display_order,
  );

  return {
    id: moment.id,
    body: moment.body,
    occurred_at: moment.occurred_at,
    location: moment.location,
    is_favorite: moment.is_favorite,
    themes: moment.themes ?? [],
    tags: extractTags(moment.moment_tags),
    media: attachments.flatMap((attachment) => {
      const signedUrl = signedUrlByPath.get(attachment.storage_path);
      return signedUrl
        ? [
            {
              id: attachment.id,
              media_type: attachment.media_type,
              mime_type: attachment.mime_type,
              original_filename: attachment.original_filename,
              signedUrl,
              display_order: attachment.display_order,
            },
          ]
        : [];
    }),
  };
}

export type { MomentDetailQueryRow };
