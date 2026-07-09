import Link from "next/link";

import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import type { TimelineSearchFilters } from "@/lib/moments/search";
import type { UserTag } from "@/lib/moments/queries";

type TimelineSearchFormProps = {
  filters: TimelineSearchFilters;
  tags: UserTag[];
};

export function TimelineSearchForm({ filters, tags }: TimelineSearchFormProps) {
  const selectedTagIds = new Set(filters.tagIds);

  return (
    <form action="/timeline" method="get" className="space-y-4">
      <Card padding="sm" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.keyword}
            placeholder="Search your moments..."
          />
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

        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="sm">
            Apply
          </Button>
          {filters.keyword || filters.tagIds.length > 0 ? (
            <Link
              href="/timeline"
              className={buttonClassName({ variant: "secondary", size: "sm" })}
            >
              Clear
            </Link>
          ) : null}
        </div>
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
