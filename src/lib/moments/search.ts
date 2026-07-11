export type TimelineSearchFilters = {
  keyword: string;
  tagIds: string[];
  favoriteOnly: boolean;
};

export type HighlightSegment = {
  text: string;
  highlighted: boolean;
};

export function parseSearchParams(params: {
  q?: string | string[];
  tag?: string | string[];
  favorite?: string | string[];
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
    favoriteOnly: params.favorite === "1",
  };
}

export function hasActiveSearchFilters(
  filters: TimelineSearchFilters,
): boolean {
  return (
    filters.keyword.length > 0 ||
    filters.tagIds.length > 0 ||
    filters.favoriteOnly
  );
}

export function buildTimelineSearchUrl(filters: TimelineSearchFilters): string {
  const params = new URLSearchParams();

  if (filters.keyword) {
    params.set("q", filters.keyword);
  }

  filters.tagIds.forEach((tagId) => params.append("tag", tagId));
  if (filters.favoriteOnly) {
    params.set("favorite", "1");
  }
  const query = params.toString();
  return query ? `/timeline?${query}` : "/timeline";
}

export function getHighlightedSegments(
  text: string,
  query: string,
): HighlightSegment[] {
  const terms = [
    ...new Set(
      query
        .trim()
        .split(/\s+/)
        .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .filter(Boolean),
    ),
  ].sort((a, b) => b.length - a.length);

  if (terms.length === 0) {
    return [{ text, highlighted: false }];
  }

  const matcher = new RegExp(`(${terms.join("|")})`, "gi");
  const exactMatch = new RegExp(`^(?:${terms.join("|")})$`, "i");

  return text
    .split(matcher)
    .filter(Boolean)
    .map((part) => ({
      text: part,
      highlighted: exactMatch.test(part),
    }));
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
