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
import { normalizeRelationItems } from "@/lib/moments/relations";
import {
  hasActiveSearchFilters,
  orderByIds,
  type TimelineSearchFilters,
} from "@/lib/moments/search";
import {
  getUtcCalendarParts,
  ON_THIS_DAY_LIMIT,
} from "@/lib/moments/on-this-day";
import {
  mapTimelineRow,
  type TimelineMoment,
  type TimelineQueryRow,
} from "@/lib/moments/timeline";
import { MEDIA_BUCKET } from "@/lib/moments/media";
import { createClient } from "@/lib/supabase/server";

export type {
  MomentDetail,
  TimelineMoment,
  TimelinePageResult,
  TimelinePagination,
};
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
    storage_path,
    thumbnail_path
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
    id,
    media_type,
    thumbnail_path
  )
`;

async function withSignedThumbnails(
  rows: TimelineQueryRow[],
): Promise<TimelineMoment[]> {
  const supabase = await createClient();
  const paths = [
    ...new Set(
      rows
        .map((row) => mapTimelineRow(row).thumbnailPath)
        .filter((path): path is string => Boolean(path)),
    ),
  ];

  const urlByPath = new Map<string, string>();

  if (paths.length > 0) {
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrls(paths, 60 * 60);

    if (!error && data) {
      for (const item of data) {
        if (item.path && item.signedUrl) {
          urlByPath.set(item.path, item.signedUrl);
        }
      }
    }
  }

  return rows.map((row) => {
    const mapped = mapTimelineRow(row);
    return {
      ...mapped,
      thumbnailUrl: mapped.thumbnailPath
        ? (urlByPath.get(mapped.thumbnailPath) ?? null)
        : null,
    };
  });
}

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

export async function getOnThisDayMoments(
  referenceDate: Date = new Date(),
): Promise<TimelineMoment[]> {
  const supabase = await createClient();
  const { month, day, year } = getUtcCalendarParts(referenceDate);

  const { data: ranked, error: rpcError } = await supabase.rpc(
    "on_this_day_moment_ids",
    {
      p_month: month,
      p_day: day,
      p_year: year,
      p_limit: ON_THIS_DAY_LIMIT,
    },
  );

  if (rpcError) {
    throw rpcError;
  }

  const ordered = (ranked ?? []) as Array<{
    id: string;
    occurred_at: string;
  }>;

  if (ordered.length === 0) {
    return [];
  }

  const orderedIds = ordered.map((row) => row.id);

  const { data, error } = await supabase
    .from("moments")
    .select(TIMELINE_SELECT)
    .in("id", orderedIds);

  if (error) {
    throw error;
  }

  return orderByIds(
    await withSignedThumbnails((data ?? []) as TimelineQueryRow[]),
    orderedIds,
  );
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

  const rows = await withSignedThumbnails((data ?? []) as TimelineQueryRow[]);

  return paginateItems(rows, limit);
}

async function searchTimelineMoments(
  filters: TimelineSearchFilters,
  limit: number,
  offset: number,
): Promise<TimelinePageResult<TimelineMoment>> {
  const supabase = await createClient();
  const fetchSize = limit + 1;

  if (filters.keyword) {
    const { data: ranked, error: searchError } = await supabase.rpc(
      "search_moment_ids",
      {
        p_query: filters.keyword,
        p_tag_ids: filters.tagIds.length > 0 ? filters.tagIds : null,
        p_limit: fetchSize,
        p_offset: offset,
      },
    );

    if (searchError) {
      throw searchError;
    }

    const orderedIds = (ranked ?? []).map(
      (row: { id: string; rank: number }) => row.id,
    );

    if (orderedIds.length === 0) {
      return { items: [], hasMore: false };
    }

    const { data, error } = await supabase
      .from("moments")
      .select(TIMELINE_SELECT)
      .in("id", orderedIds);

    if (error) {
      throw error;
    }

    const rows = orderByIds(
      await withSignedThumbnails((data ?? []) as TimelineQueryRow[]),
      orderedIds,
    );

    return paginateItems(rows, limit);
  }

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

  let query = supabase.from("moments").select(TIMELINE_SELECT);

  if (momentIds) {
    query = query.in("id", momentIds);
  }

  const { data, error } = await query
    .order("occurred_at", { ascending: false })
    .range(offset, offset + fetchSize - 1);

  if (error) {
    throw error;
  }

  const rows = await withSignedThumbnails((data ?? []) as TimelineQueryRow[]);

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
  const attachment = normalizeRelationItems(row.media_attachments)[0] ?? null;
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
