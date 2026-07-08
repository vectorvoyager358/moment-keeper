import type { MediaType } from "@/lib/database.types";
import { normalizeRelationItems } from "@/lib/moments/relations";

export type MomentMedia = {
  id: string;
  media_type: MediaType;
  mime_type: string;
  original_filename: string | null;
  signedUrl: string;
};

export type MomentDetail = {
  id: string;
  body: string;
  occurred_at: string;
  tags: { id: string; name: string }[];
  media: MomentMedia | null;
};

type MomentDetailQueryRow = {
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
        media_type: MediaType;
        mime_type: string;
        original_filename: string | null;
        storage_path: string;
      }
    | {
        id: string;
        media_type: MediaType;
        mime_type: string;
        original_filename: string | null;
        storage_path: string;
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
  signedUrl: string | null,
): MomentDetail {
  const attachment =
    normalizeRelationItems(moment.media_attachments)[0] ?? null;

  return {
    id: moment.id,
    body: moment.body,
    occurred_at: moment.occurred_at,
    tags: extractTags(moment.moment_tags),
    media:
      attachment && signedUrl
        ? {
            id: attachment.id,
            media_type: attachment.media_type,
            mime_type: attachment.mime_type,
            original_filename: attachment.original_filename,
            signedUrl,
          }
        : null,
  };
}

export type { MomentDetailQueryRow };
