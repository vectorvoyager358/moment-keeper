export type TimelineSearchFilters = {
  keyword: string;
  tagIds: string[];
};

export function parseSearchParams(params: {
  q?: string | string[];
  tag?: string | string[];
}): TimelineSearchFilters {
  const keyword = typeof params.q === "string" ? params.q.trim() : "";
  const tagParam = params.tag;
  const tagIds = Array.isArray(tagParam)
    ? tagParam
    : tagParam
      ? [tagParam]
      : [];

  return {
    keyword,
    tagIds: [...new Set(tagIds.filter(Boolean))],
  };
}

export function hasActiveSearchFilters(
  filters: TimelineSearchFilters,
): boolean {
  return filters.keyword.length > 0 || filters.tagIds.length > 0;
}

export function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

export function buildIlikePattern(keyword: string): string {
  return `%${escapeIlikePattern(keyword)}%`;
}
