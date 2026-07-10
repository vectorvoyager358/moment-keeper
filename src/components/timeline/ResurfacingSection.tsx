import { Sparkles } from "lucide-react";
import Link from "next/link";

import { ResurfacingChooser } from "@/components/timeline/ResurfacingChooser";
import { MomentCard } from "@/components/timeline/MomentCard";
import { Card } from "@/components/ui/Card";
import { toUserErrorMessage } from "@/lib/errors";
import { getResurfacedMoments } from "@/lib/moments/queries";
import { hasActiveSearchFilters } from "@/lib/moments/search";
import {
  hasActiveResurfacingFilters,
  memoryThemeLabel,
  type ResurfacingFilters,
} from "@/lib/moments/themes";
import type { TimelineSearchFilters } from "@/lib/moments/search";

type ResurfacingSectionProps = {
  searchFilters: TimelineSearchFilters;
  resurfacingFilters: ResurfacingFilters;
};

export async function ResurfacingSection({
  searchFilters,
  resurfacingFilters,
}: ResurfacingSectionProps) {
  if (hasActiveSearchFilters(searchFilters)) {
    return null;
  }

  if (!hasActiveResurfacingFilters(resurfacingFilters)) {
    return <ResurfacingChooser />;
  }

  let moments;

  try {
    moments = await getResurfacedMoments(
      resurfacingFilters.themes,
      resurfacingFilters.mediaType,
    );
  } catch (error) {
    throw new Error(
      toUserErrorMessage(error, "Could not find memories for you."),
    );
  }

  const themeLabels = resurfacingFilters.themes.map(memoryThemeLabel);

  return (
    <section className="mb-8" aria-labelledby="resurfacing-heading">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2
              id="resurfacing-heading"
              className="font-display text-xl font-semibold text-ink"
            >
              Memories for you
            </h2>
            <p className="mt-1 text-sm text-muted">
              {themeLabels.join(" · ")}
              {resurfacingFilters.mediaType
                ? ` · ${resurfacingFilters.mediaType}`
                : ""}
            </p>
          </div>
        </div>
        <Link
          href="/timeline"
          className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-accent transition hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          Change
        </Link>
      </div>

      {moments.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {moments.map((moment, index) => (
            <li
              key={moment.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
            >
              <MomentCard moment={moment} />
            </li>
          ))}
        </ul>
      ) : (
        <Card
          padding="lg"
          className="border-dashed border-border-strong bg-accent-subtle/35 text-center"
        >
          <p className="font-display text-lg font-semibold text-ink">
            No matching memories yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Add themes while capturing or editing moments. We&apos;ll also match
            related words from what you wrote.
          </p>
          <div className="mt-4 flex justify-center gap-4 text-sm font-medium">
            <Link href="/capture" className="text-accent hover:underline">
              Capture a moment
            </Link>
            <Link href="/timeline" className="text-muted hover:text-ink">
              Choose something else
            </Link>
          </div>
        </Card>
      )}
    </section>
  );
}
