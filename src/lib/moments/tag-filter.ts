export const TAG_FILTER_SEARCH_MIN = 10;
export const TAG_VISIBLE_LIMIT = 12;

export type TagPickerItem = {
  id: string;
  name: string;
  momentCount?: number;
};

export function filterTagsByQuery<T extends TagPickerItem>(
  tags: T[],
  query: string,
): T[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return tags;
  }

  return tags.filter((tag) => tag.name.toLowerCase().includes(normalized));
}

export function visibleTagsForPicker<T extends TagPickerItem>(
  tags: T[],
  selectedIds: string[],
  options: { limit: number; expanded: boolean },
): T[] {
  if (options.expanded || tags.length <= options.limit) {
    return tags;
  }

  const selected = new Set(selectedIds);
  const visible = tags.slice(0, options.limit);
  const visibleIds = new Set(visible.map((tag) => tag.id));

  for (const tag of tags) {
    if (selected.has(tag.id) && !visibleIds.has(tag.id)) {
      visible.push(tag);
      visibleIds.add(tag.id);
    }
  }

  return visible;
}

export function hiddenTagCount(total: number, visible: number): number {
  return Math.max(total - visible, 0);
}

export function compareTagsForPicker(
  a: TagPickerItem,
  b: TagPickerItem,
): number {
  const countDiff = (b.momentCount ?? 0) - (a.momentCount ?? 0);

  if (countDiff !== 0) {
    return countDiff;
  }

  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}
