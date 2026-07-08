import Link from "next/link";

import type { TimelineSearchFilters } from "@/lib/moments/search";
import type { UserTag } from "@/lib/moments/queries";

type TimelineSearchFormProps = {
  filters: TimelineSearchFilters;
  tags: UserTag[];
};

export function TimelineSearchForm({ filters, tags }: TimelineSearchFormProps) {
  const selectedTagIds = new Set(filters.tagIds);

  return (
    <form
      action="/timeline"
      method="get"
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="space-y-2">
        <label
          htmlFor="q"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Search
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={filters.keyword}
          placeholder="Search your moments..."
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>

      {tags.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Filter by tag
          </legend>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <label
                key={tag.id}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition ${
                  selectedTagIds.has(tag.id)
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
                }`}
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
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Apply
        </button>
        {filters.keyword || filters.tagIds.length > 0 ? (
          <Link
            href="/timeline"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Clear
          </Link>
        ) : null}
      </div>
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
      className={`rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900 ${className ?? ""}`}
    >
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
        No matching moments
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Try a different keyword or remove a tag filter.
      </p>
      <Link
        href="/timeline"
        className="mt-6 inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        Clear search
      </Link>
    </div>
  );
}
