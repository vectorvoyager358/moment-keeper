import Link from "next/link";
import { Search, X } from "lucide-react";

import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import {
  buildTimelineSearchUrl,
  type TimelineSearchFilters,
} from "@/lib/moments/search";
import type { UserTag } from "@/lib/moments/queries";

type TimelineSearchFormProps = {
  filters: TimelineSearchFilters;
  tags: UserTag[];
};

export function TimelineSearchForm({ filters, tags }: TimelineSearchFormProps) {
  const selectedTagIds = new Set(filters.tagIds);
  const selectedTags = tags.filter((tag) => selectedTagIds.has(tag.id));

  return (
    <form action="/timeline" method="get" className="space-y-4">
      <Card padding="sm" className="space-y-3 rounded-[1.25rem]">
        <div className="flex items-center gap-2">
          <Label htmlFor="q" className="sr-only">
            Search
          </Label>
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              id="q"
              name="q"
              type="search"
              defaultValue={filters.keyword}
              placeholder="Search your moments..."
              className="border-transparent bg-accent-subtle/55 pl-9 focus:border-accent"
            />
          </div>
          <Button type="submit" size="sm">
            Search
          </Button>
        </div>

        {tags.length > 0 ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-ink">
              Filter by tag
            </legend>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition",
                    selectedTagIds.has(tag.id)
                      ? "border-accent bg-accent text-white"
                      : "border-border-strong bg-tag text-tag-text hover:border-accent/50",
                  )}
                >
                  <input
                    type="checkbox"
                    name="tag"
                    value={tag.id}
                    defaultChecked={selectedTagIds.has(tag.id)}
                    className="sr-only"
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {filters.keyword || selectedTags.length > 0 ? (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
              Active filters
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {filters.keyword ? (
                <Link
                  href={buildTimelineSearchUrl({
                    keyword: "",
                    tagIds: filters.tagIds,
                  })}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-accent transition hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  aria-label={`Remove keyword filter ${filters.keyword}`}
                >
                  “{filters.keyword}”
                  <X className="h-3 w-3" aria-hidden />
                </Link>
              ) : null}
              {selectedTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={buildTimelineSearchUrl({
                    keyword: filters.keyword,
                    tagIds: filters.tagIds.filter((tagId) => tagId !== tag.id),
                  })}
                  className="inline-flex items-center gap-1 rounded-full bg-tag px-3 py-1 text-xs font-medium text-tag-text transition hover:bg-accent-subtle hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  aria-label={`Remove tag filter ${tag.name}`}
                >
                  {tag.name}
                  <X className="h-3 w-3" aria-hidden />
                </Link>
              ))}
              <Link
                href="/timeline"
                className={buttonClassName({
                  variant: "ghost",
                  size: "sm",
                  className: "ml-auto",
                })}
              >
                Clear all
              </Link>
            </div>
          </div>
        ) : null}
      </Card>
    </form>
  );
}

type TimelineSearchEmptyStateProps = {
  className?: string;
};

export function TimelineSearchEmptyState({
  className,
}: TimelineSearchEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center",
        className,
      )}
    >
      <h2 className="font-display text-xl font-semibold text-ink">
        No matching moments
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        Try a different keyword or remove a tag filter.
      </p>
      <Link
        href="/timeline"
        className={buttonClassName({
          variant: "secondary",
          className: "mt-6",
        })}
      >
        Clear search
      </Link>
    </div>
  );
}
