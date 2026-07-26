export const TIMELINE_PAGE_SIZE = 20;
export const TIMELINE_INITIAL_PAGE_SIZE = 8;

export type TimelineCursor = {
  occurredAt: string;
  id: string;
};

export type TimelinePagination = {
  limit?: number;
  offset?: number;
  cursor?: TimelineCursor | null;
};

export type TimelinePageResult<T> = {
  items: T[];
  hasMore: boolean;
  nextCursor?: TimelineCursor | null;
};

export function buildTimelineCursorFilter(cursor: TimelineCursor): string {
  return `occurred_at.lt.${cursor.occurredAt},and(occurred_at.eq.${cursor.occurredAt},id.lt.${cursor.id})`;
}

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
