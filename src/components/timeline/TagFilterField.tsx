"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { FieldHint, Input, Label } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import {
  filterTagsByQuery,
  hiddenTagCount,
  TAG_FILTER_SEARCH_MIN,
  TAG_VISIBLE_LIMIT,
  type TagPickerItem,
  visibleTagsForPicker,
} from "@/lib/moments/tag-filter";

type TagFilterFieldProps = {
  tags: TagPickerItem[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
};

export function TagFilterField({
  tags,
  selectedTagIds,
  onToggleTag,
}: TagFilterFieldProps) {
  const [tagQuery, setTagQuery] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);
  const selectedTagIdsSet = new Set(selectedTagIds);
  const filteredTags = filterTagsByQuery(tags, tagQuery);
  const visibleTags = visibleTagsForPicker(filteredTags, selectedTagIds, {
    limit: TAG_VISIBLE_LIMIT,
    expanded: showAllTags || tagQuery.trim().length > 0,
  });
  const hiddenCount = hiddenTagCount(filteredTags.length, visibleTags.length);
  const showTagSearch = tags.length >= TAG_FILTER_SEARCH_MIN;

  if (tags.length === 0) {
    return null;
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-ink">Tags</legend>

      {showTagSearch ? (
        <div className="space-y-1">
          <Label htmlFor="tag-filter" className="sr-only">
            Filter tags
          </Label>
          <Input
            id="tag-filter"
            type="search"
            value={tagQuery}
            onChange={(event) => {
              setTagQuery(event.target.value);
              setShowAllTags(false);
            }}
            placeholder="Filter tags…"
            className="border-border bg-surface text-sm"
          />
          <FieldHint>
            {tagQuery.trim()
              ? `${filteredTags.length} matching tag${filteredTags.length === 1 ? "" : "s"}`
              : `${tags.length} tags — most used first`}
          </FieldHint>
        </div>
      ) : (
        <FieldHint>{tags.length} tags — most used first</FieldHint>
      )}

      {filteredTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {visibleTags.map((tag) => {
            const selected = selectedTagIdsSet.has(tag.id);

            return (
              <button
                key={tag.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onToggleTag(tag.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                  selected
                    ? "border-accent bg-accent text-white"
                    : "border-border-strong bg-tag text-tag-text hover:border-accent/50",
                )}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted">No tags match that filter.</p>
      )}

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setShowAllTags(true)}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent transition hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          Show {hiddenCount} more tag{hiddenCount === 1 ? "" : "s"}
          <ChevronDown className="h-4 w-4" aria-hidden />
        </button>
      ) : null}

      {showAllTags &&
      !tagQuery.trim() &&
      filteredTags.length > TAG_VISIBLE_LIMIT ? (
        <button
          type="button"
          onClick={() => setShowAllTags(false)}
          className="text-sm font-medium text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          Show fewer tags
        </button>
      ) : null}
    </fieldset>
  );
}
