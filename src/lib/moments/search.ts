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

/** Preserve RPC / query result order when hydrating full moment rows. */
export function orderByIds<T extends { id: string }>(
  items: T[],
  orderedIds: string[],
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return orderedIds.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}
