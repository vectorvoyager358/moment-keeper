import {
  mapMomentDetailRow,
  type MomentDetail,
  type MomentDetailQueryRow,
} from "@/lib/moments/detail";
import {
  paginateItems,
  TIMELINE_PAGE_SIZE,
  type TimelinePageResult,
  type TimelinePagination,
} from "@/lib/moments/pagination";
import {
  buildIlikePattern,
  hasActiveSearchFilters,
  type TimelineSearchFilters,
} from "@/lib/moments/search";
import {
  mapTimelineRow,
  type TimelineMoment,
  type TimelineQueryRow,
} from "@/lib/moments/timeline";
import { createClient } from "@/lib/supabase/server";

export type { MomentDetail, TimelineMoment, TimelinePageResult, TimelinePagination };
export { TIMELINE_PAGE_SIZE };

export type UserTag = {
  id: string;
  name: string;
};

const MOMENT_SELECT = `
  id,
  body,
  occurred_at,
  moment_tags (
    tags (
      id,
      name
    )
  ),
  media_attachments (
    id,
    media_type,
    mime_type,
    original_filename,
    storage_path
  )
`;

const TIMELINE_SELECT = `
  id,
  body,
  occurred_at,
  moment_tags (
    tags (
      id,
      name
    )
  ),
  media_attachments (
    id
  )
`;

export async function getUserTags(): Promise<UserTag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tags")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getTimelineMoments(
  filters: TimelineSearchFilters = { keyword: "", tagIds: [] },
  pagination: TimelinePagination = {},
): Promise<TimelinePageResult<TimelineMoment>> {
  const limit = pagination.limit ?? TIMELINE_PAGE_SIZE;
  const offset = pagination.offset ?? 0;

  if (!hasActiveSearchFilters(filters)) {
    return fetchAllTimelineMoments(limit, offset);
  }

  return searchTimelineMoments(filters, limit, offset);
}

async function fetchAllTimelineMoments(
  limit: number,
  offset: number,
): Promise<TimelinePageResult<TimelineMoment>> {
  const supabase = await createClient();
  const fetchSize = limit + 1;

  const { data, error } = await supabase
    .from("moments")
    .select(TIMELINE_SELECT)
    .order("occurred_at", { ascending: false })
    .range(offset, offset + fetchSize - 1);

  if (error) {
    throw error;
  }

  const rows = ((data ?? []) as TimelineQueryRow[]).map(mapTimelineRow);

  return paginateItems(rows, limit);
}

async function searchTimelineMoments(
  filters: TimelineSearchFilters,
  limit: number,
  offset: number,
): Promise<TimelinePageResult<TimelineMoment>> {
  const supabase = await createClient();
  let momentIds: string[] | null = null;

  if (filters.tagIds.length > 0) {
    const { data: links, error: tagError } = await supabase
      .from("moment_tags")
      .select("moment_id")
      .in("tag_id", filters.tagIds);

    if (tagError) {
      throw tagError;
    }

    momentIds = [...new Set((links ?? []).map((link) => link.moment_id))];

    if (momentIds.length === 0) {
      return { items: [], hasMore: false };
    }
  }

  const fetchSize = limit + 1;
  let query = supabase.from("moments").select(TIMELINE_SELECT);

  if (filters.keyword) {
    query = query.ilike("body", buildIlikePattern(filters.keyword));
  }

  if (momentIds) {
    query = query.in("id", momentIds);
  }

  const { data, error } = await query
    .order("occurred_at", { ascending: false })
    .range(offset, offset + fetchSize - 1);

  if (error) {
    throw error;
  }

  const rows = ((data ?? []) as TimelineQueryRow[]).map(mapTimelineRow);

  return paginateItems(rows, limit);
}

export async function getMomentById(id: string): Promise<MomentDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("moments")
    .select(MOMENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as MomentDetailQueryRow;
  const attachment = row.media_attachments?.[0] ?? null;
  let signedUrl: string | null = null;

  if (attachment) {
    const { data: signedData, error: signedError } = await supabase.storage
      .from("moment-media")
      .createSignedUrl(attachment.storage_path, 60 * 60);

    if (signedError) {
      throw signedError;
    }

    signedUrl = signedData.signedUrl;
  }

  return mapMomentDetailRow(row, signedUrl);
}
