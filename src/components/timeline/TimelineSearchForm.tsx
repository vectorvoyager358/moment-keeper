"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Search, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { TagFilterField } from "@/components/timeline/TagFilterField";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import {
  buildTimelineSearchUrl,
  normalizeSearchKeyword,
  type TimelineSearchFilters,
} from "@/lib/moments/search";
import type { UserTag } from "@/lib/moments/queries";

const KEYWORD_DEBOUNCE_MS = 350;

type TimelineSearchFormProps = {
  filters: TimelineSearchFilters;
  tags: UserTag[];
  embedded?: boolean;
};

function filtersKey(filters: TimelineSearchFilters): string {
  return `${filters.keyword}|${filters.tagIds.join(",")}|${filters.favoriteOnly}`;
}

function SearchFieldsContainer({
  embedded,
  children,
}: {
  embedded: boolean;
  children: ReactNode;
}) {
  if (embedded) {
    return <div className="space-y-3">{children}</div>;
  }

  return (
    <Card padding="sm" className="space-y-3 rounded-[1.25rem]">
      {children}
    </Card>
  );
}

export function TimelineSearchForm({
  filters,
  tags,
  embedded = false,
}: TimelineSearchFormProps) {
  return (
    <TimelineSearchFormFields
      key={filtersKey(filters)}
      filters={filters}
      tags={tags}
      embedded={embedded}
    />
  );
}

function TimelineSearchFormFields({
  filters,
  tags,
  embedded = false,
}: TimelineSearchFormProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(filters.keyword);
  const selectedTagIds = new Set(filters.tagIds);
  const selectedTags = tags.filter((tag) => selectedTagIds.has(tag.id));

  useEffect(() => {
    const trimmed = normalizeSearchKeyword(keyword);

    if (trimmed === filters.keyword) {
      return;
    }

    const timer = window.setTimeout(() => {
      router.push(
        buildTimelineSearchUrl({
          keyword: trimmed,
          tagIds: filters.tagIds,
          favoriteOnly: filters.favoriteOnly,
        }),
        { scroll: false },
      );
    }, KEYWORD_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filters.favoriteOnly, filters.keyword, filters.tagIds, keyword, router]);

  function navigate(nextFilters: TimelineSearchFilters) {
    router.push(buildTimelineSearchUrl(nextFilters), { scroll: false });
  }

  function toggleTag(tagId: string) {
    const nextTagIds = selectedTagIds.has(tagId)
      ? filters.tagIds.filter((id) => id !== tagId)
      : [...filters.tagIds, tagId];

    navigate({
      keyword: filters.keyword,
      tagIds: nextTagIds,
      favoriteOnly: filters.favoriteOnly,
    });
  }

  function toggleFavorite() {
    navigate({
      keyword: filters.keyword,
      tagIds: filters.tagIds,
      favoriteOnly: !filters.favoriteOnly,
    });
  }

  return (
    <div className="space-y-4">
      <SearchFieldsContainer embedded={embedded}>
        <div className="relative min-w-0">
          <Label htmlFor="q" className="sr-only">
            Find a moment
          </Label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            id="q"
            name="q"
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder='Try a word, place, or "exact phrase"'
            className="border-transparent bg-accent-subtle/55 pl-9 focus:border-accent"
          />
        </div>

        <TagFilterField
          tags={tags}
          selectedTagIds={filters.tagIds}
          onToggleTag={toggleTag}
        />

        <button
          type="button"
          aria-pressed={filters.favoriteOnly}
          aria-label="Show favorites only"
          onClick={toggleFavorite}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
            filters.favoriteOnly
              ? "border-accent bg-accent text-white"
              : "border-border-strong bg-surface text-muted hover:border-accent/50 hover:text-accent",
          )}
        >
          <Heart
            className={cn("h-4 w-4", filters.favoriteOnly && "fill-current")}
            aria-hidden
          />
          <span>Favorites</span>
        </button>

        {filters.keyword || selectedTags.length > 0 || filters.favoriteOnly ? (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
              Looking for
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {filters.keyword ? (
                <Link
                  href={buildTimelineSearchUrl({
                    keyword: "",
                    tagIds: filters.tagIds,
                    favoriteOnly: filters.favoriteOnly,
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
                    favoriteOnly: filters.favoriteOnly,
                  })}
                  className="inline-flex items-center gap-1 rounded-full bg-tag px-3 py-1 text-xs font-medium text-tag-text transition hover:bg-accent-subtle hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  aria-label={`Remove tag filter ${tag.name}`}
                >
                  {tag.name}
                  <X className="h-3 w-3" aria-hidden />
                </Link>
              ))}
              {filters.favoriteOnly ? (
                <Link
                  href={buildTimelineSearchUrl({
                    keyword: filters.keyword,
                    tagIds: filters.tagIds,
                    favoriteOnly: false,
                  })}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-accent transition hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  aria-label="Remove favorites filter"
                >
                  <Heart className="h-3 w-3 fill-current" aria-hidden />
                  Favorites
                  <X className="h-3 w-3" aria-hidden />
                </Link>
              ) : null}
              <Link
                href="/timeline"
                className={buttonClassName({
                  variant: "ghost",
                  size: "sm",
                  className: "ml-auto",
                })}
              >
                Start over
              </Link>
            </div>
          </div>
        ) : null}
      </SearchFieldsContainer>
    </div>
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
        Nothing turned up
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        Try another word or place, use fewer tags, or search with an exact
        phrase in quotes.
      </p>
      <Link
        href="/timeline"
        className={buttonClassName({
          variant: "secondary",
          className: "mt-6",
        })}
      >
        See everything again
      </Link>
    </div>
  );
}
