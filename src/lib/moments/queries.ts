import {
  mapMomentDetailRow,
  type MomentDetail,
  type MomentDetailQueryRow,
} from "@/lib/moments/detail";
import type { MediaType, MemoryTheme } from "@/lib/database.types";
import { getCalendarMonthRange } from "@/lib/moments/calendar";
import {
  buildTimelineCursorFilter,
  paginateItems,
  TIMELINE_PAGE_SIZE,
  type TimelineCursor,
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
  getLocalCalendarParts,
  ON_THIS_DAY_LIMIT,
} from "@/lib/moments/on-this-day";
import { getRequestTimeZone } from "@/lib/timezone.server";
import {
  mapTimelineRow,
  type TimelineMoment,
  type TimelineQueryRow,
} from "@/lib/moments/timeline";
import { MEDIA_BUCKET } from "@/lib/moments/media";
import { compareTagsForPicker } from "@/lib/moments/tag-filter";
import { RESURFACED_MOMENT_LIMIT } from "@/lib/moments/themes";
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
  momentCount: number;
};

const MOMENT_SELECT = `
  id,
  body,
  body_content,
  occurred_at,
  location,
  link_url,
  is_favorite,
  themes,
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
    thumbnail_path,
    display_order
  )
`;

const TIMELINE_SELECT = `
  id,
  body,
  occurred_at,
  location,
  link_url,
  is_favorite,
  moment_tags (
    tags (
      id,
      name
    )
  ),
  media_attachments (
    id,
    media_type,
    storage_path,
    thumbnail_path,
    display_order
  )
`;

const MEDIA_GALLERY_SELECT = `
  id,
  body,
  occurred_at,
  location,
  is_favorite,
  moment_tags (
    tags (
      id,
      name
    )
  ),
  media_attachments!inner (
    id,
    media_type,
    storage_path,
    thumbnail_path,
    display_order
  )
`;

export const MEDIA_GALLERY_LIMIT = 60;
const SIGNED_MEDIA_URL_TTL_SECONDS = 60 * 60;

export type MediaGalleryItem = {
  id: string;
  momentId: string;
  body: string;
  occurred_at: string;
  location: string | null;
  mediaType: MediaType;
  thumbnailUrl: string | null;
  photoUrl: string | null;
  videoUrl: string | null;
};

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

async function createSignedMediaUrlMap(
  supabase: ServerSupabase,
  paths: string[],
): Promise<Map<string, string>> {
  const urlByPath = new Map<string, string>();

  if (paths.length === 0) {
    return urlByPath;
  }

  const bucket = supabase.storage.from(MEDIA_BUCKET);
  const { data } = await bucket.createSignedUrls(
    paths,
    SIGNED_MEDIA_URL_TTL_SECONDS,
  );

  // Supabase can return successful entries alongside a batch-level error.
  // Preserve every usable URL instead of dropping the whole batch.
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) {
      urlByPath.set(item.path, item.signedUrl);
    }
  }

  const missingPaths = paths.filter((path) => !urlByPath.has(path));

  if (
    missingPaths.length === 0 ||
    typeof bucket.createSignedUrl !== "function"
  ) {
    return urlByPath;
  }

  await Promise.all(
    missingPaths.map(async (path) => {
      try {
        const { data: signedData } = await bucket.createSignedUrl(
          path,
          SIGNED_MEDIA_URL_TTL_SECONDS,
        );

        if (signedData?.signedUrl) {
          urlByPath.set(path, signedData.signedUrl);
        }
      } catch {
        // Keep other media previews available when one stored path is invalid.
      }
    }),
  );

  return urlByPath;
}

async function withSignedThumbnails(
  rows: TimelineQueryRow[],
): Promise<TimelineMoment[]> {
  const supabase = await createClient();
  const paths = [
    ...new Set(
      rows.flatMap((row) => {
        const mapped = mapTimelineRow(row);
        return [
          mapped.thumbnailPath,
          mapped.photoStoragePath,
          mapped.videoStoragePath,
        ].filter((path): path is string => Boolean(path));
      }),
    ),
  ];

  const urlByPath = await createSignedMediaUrlMap(supabase, paths);

  return rows.map((row) => {
    const mapped = mapTimelineRow(row);
    const thumbnailUrl = mapped.thumbnailPath
      ? (urlByPath.get(mapped.thumbnailPath) ?? null)
      : null;
    const photoUrl = mapped.photoStoragePath
      ? (urlByPath.get(mapped.photoStoragePath) ?? null)
      : null;
    const videoUrl = mapped.videoStoragePath
      ? (urlByPath.get(mapped.videoStoragePath) ?? null)
      : null;

    return {
      ...mapped,
      thumbnailUrl,
      photoUrl,
      videoUrl,
    };
  });
}

export async function getUserTags(): Promise<UserTag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("tags").select(`
      id,
      name,
      moment_tags (count)
    `);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      momentCount:
        Array.isArray(tag.moment_tags) && tag.moment_tags[0]?.count
          ? tag.moment_tags[0].count
          : 0,
    }))
    .sort(compareTagsForPicker);
}

export async function getRandomMomentId(): Promise<string | null> {
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("moments")
    .select("id", { count: "exact", head: true });

  if (countError) {
    throw countError;
  }

  if (!count) {
    return null;
  }

  const offset = Math.floor(Math.random() * count);
  const { data, error } = await supabase
    .from("moments")
    .select("id")
    .order("occurred_at", { ascending: false })
    .range(offset, offset)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

export async function getCalendarMoments(
  year: number,
  month: number,
): Promise<TimelineMoment[]> {
  const supabase = await createClient();
  const { start, end } = getCalendarMonthRange({ year, month });
  const { data, error } = await supabase
    .from("moments")
    .select(TIMELINE_SELECT)
    .gte("occurred_at", start)
    .lt("occurred_at", end)
    .order("occurred_at", { ascending: true });

  if (error) {
    throw error;
  }

  return withSignedThumbnails((data ?? []) as TimelineQueryRow[]);
}

export async function getMediaGalleryMoments(
  mediaType: MediaType | null = null,
): Promise<MediaGalleryItem[]> {
  const supabase = await createClient();
  let query = supabase.from("moments").select(MEDIA_GALLERY_SELECT);

  if (mediaType) {
    query = query.eq("media_attachments.media_type", mediaType);
  }

  const { data, error } = await query
    .order("occurred_at", { ascending: false })
    .limit(MEDIA_GALLERY_LIMIT);

  if (error) {
    throw error;
  }

  const items = ((data ?? []) as TimelineQueryRow[])
    .flatMap((moment) =>
      normalizeRelationItems(moment.media_attachments)
        .sort((a, b) => a.display_order - b.display_order)
        .map((attachment) => ({
          id: attachment.id,
          momentId: moment.id,
          body: moment.body,
          occurred_at: moment.occurred_at,
          location: moment.location,
          mediaType: attachment.media_type,
          thumbnailPath: attachment.thumbnail_path,
          photoStoragePath:
            attachment.media_type === "photo"
              ? (attachment.storage_path ?? null)
              : null,
          videoStoragePath:
            attachment.media_type === "video"
              ? (attachment.storage_path ?? null)
              : null,
        })),
    )
    .slice(0, MEDIA_GALLERY_LIMIT);
  const storagePaths = [
    ...new Set(
      items.flatMap((item) =>
        [
          item.thumbnailPath,
          item.photoStoragePath,
          item.videoStoragePath,
        ].filter((path): path is string => Boolean(path)),
      ),
    ),
  ];
  const signedUrlByPath = await createSignedMediaUrlMap(supabase, storagePaths);

  return items.map(
    ({ thumbnailPath, photoStoragePath, videoStoragePath, ...item }) => {
      const thumbnailUrl = thumbnailPath
        ? (signedUrlByPath.get(thumbnailPath) ?? null)
        : null;
      const photoUrl = photoStoragePath
        ? (signedUrlByPath.get(photoStoragePath) ?? null)
        : null;
      const videoUrl = videoStoragePath
        ? (signedUrlByPath.get(videoStoragePath) ?? null)
        : null;

      return {
        ...item,
        thumbnailUrl,
        photoUrl,
        videoUrl,
      };
    },
  );
}

export async function getOnThisDayMoments(
  referenceDate: Date = new Date(),
  timeZone?: string,
): Promise<TimelineMoment[]> {
  const supabase = await createClient();
  const resolvedTimeZone = timeZone ?? (await getRequestTimeZone());
  const { month, day, year } = getLocalCalendarParts(
    referenceDate,
    resolvedTimeZone,
  );

  const { data: ranked, error: rpcError } = await supabase.rpc(
    "on_this_day_moment_ids",
    {
      p_month: month,
      p_day: day,
      p_year: year,
      p_limit: ON_THIS_DAY_LIMIT,
      p_timezone: resolvedTimeZone,
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

export async function getResurfacedMoments(
  themes: MemoryTheme[],
  mediaType: MediaType | null = null,
): Promise<TimelineMoment[]> {
  if (themes.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data: ranked, error: rpcError } = await supabase.rpc(
    "resurface_moment_ids",
    {
      p_themes: themes,
      p_media_type: mediaType,
      p_limit: RESURFACED_MOMENT_LIMIT,
    },
  );

  if (rpcError) {
    throw rpcError;
  }

  const orderedIds = (ranked ?? []).map(
    (row: { id: string; match_source: string; rank: number }) => row.id,
  );

  if (orderedIds.length === 0) {
    return [];
  }

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
  filters: TimelineSearchFilters = {
    keyword: "",
    tagIds: [],
    favoriteOnly: false,
  },
  pagination: TimelinePagination = {},
): Promise<TimelinePageResult<TimelineMoment>> {
  const limit = pagination.limit ?? TIMELINE_PAGE_SIZE;
  const offset = pagination.offset ?? 0;

  if (!hasActiveSearchFilters(filters)) {
    return fetchAllTimelineMoments(limit, pagination.cursor ?? null);
  }

  return searchTimelineMoments(filters, limit, offset);
}

async function fetchAllTimelineMoments(
  limit: number,
  cursor: TimelineCursor | null,
): Promise<TimelinePageResult<TimelineMoment>> {
  const supabase = await createClient();
  const fetchSize = limit + 1;

  let query = supabase
    .from("moments")
    .select(TIMELINE_SELECT)
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: false });

  if (cursor) {
    query = query.or(buildTimelineCursorFilter(cursor));
  }

  const { data, error } = await query.limit(fetchSize);

  if (error) {
    throw error;
  }

  const rows = await withSignedThumbnails((data ?? []) as TimelineQueryRow[]);

  const page = paginateItems(rows, limit);
  const lastMoment = page.items.at(-1);

  return {
    ...page,
    nextCursor:
      page.hasMore && lastMoment
        ? { occurredAt: lastMoment.occurred_at, id: lastMoment.id }
        : null,
  };
}

async function searchTimelineMoments(
  filters: TimelineSearchFilters,
  limit: number,
  offset: number,
): Promise<TimelinePageResult<TimelineMoment>> {
  const supabase = await createClient();
  const fetchSize = limit + 1;

  const { data: ranked, error: searchError } = await supabase.rpc(
    "search_moment_ids",
    {
      p_query: filters.keyword,
      p_tag_ids: filters.tagIds.length > 0 ? filters.tagIds : null,
      p_limit: fetchSize,
      p_offset: offset,
      p_favorite_only: filters.favoriteOnly,
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
  const attachments = normalizeRelationItems(row.media_attachments);
  const signedUrlByPath = new Map<string, string>();

  if (attachments.length > 0) {
    const { data: signedData, error: signedError } = await supabase.storage
      .from("moment-media")
      .createSignedUrls(
        attachments.map((attachment) => attachment.storage_path),
        60 * 60,
      );

    if (signedError) {
      throw signedError;
    }

    for (const item of signedData) {
      if (item.path && item.signedUrl) {
        signedUrlByPath.set(item.path, item.signedUrl);
      }
    }
  }

  return mapMomentDetailRow(row, signedUrlByPath);
}

export async function getUserMomentCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("moments")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function getAdjacentMomentIds(momentId: string): Promise<{
  earlierId: string | null;
  laterId: string | null;
}> {
  const supabase = await createClient();

  const { data: current, error } = await supabase
    .from("moments")
    .select("occurred_at")
    .eq("id", momentId)
    .maybeSingle();

  if (error || !current) {
    if (error) {
      throw error;
    }
    return { earlierId: null, laterId: null };
  }

  const [{ data: earlier }, { data: later }] = await Promise.all([
    supabase
      .from("moments")
      .select("id")
      .or(
        `occurred_at.lt.${current.occurred_at},and(occurred_at.eq.${current.occurred_at},id.lt.${momentId})`,
      )
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1),
    supabase
      .from("moments")
      .select("id")
      .or(
        `occurred_at.gt.${current.occurred_at},and(occurred_at.eq.${current.occurred_at},id.gt.${momentId})`,
      )
      .order("occurred_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(1),
  ]);

  return {
    earlierId: earlier?.[0]?.id ?? null,
    laterId: later?.[0]?.id ?? null,
  };
}
