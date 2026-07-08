export const TIMELINE_PAGE_SIZE = 20;

export type TimelinePagination = {
  limit?: number;
  offset?: number;
};

export type TimelinePageResult<T> = {
  items: T[];
  hasMore: boolean;
};

export function paginateItems<T>(
  items: T[],
  limit: number,
): TimelinePageResult<T> {
  const hasMore = items.length > limit;

  return {
    items: hasMore ? items.slice(0, limit) : items,
    hasMore,
  };
}
