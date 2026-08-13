export const TAGS_REMOVED_EVENT = "moment-keeper:tags-removed";

export type TagsRemovedEvent = CustomEvent<string[]>;

export function announceRemovedTags(tagIds: string[]): void {
  if (tagIds.length === 0) {
    return;
  }

  window.dispatchEvent(new CustomEvent(TAGS_REMOVED_EVENT, { detail: tagIds }));
}
