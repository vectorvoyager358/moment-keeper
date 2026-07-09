import Link from "next/link";
import { CalendarHeart } from "lucide-react";

import { MomentCard } from "@/components/timeline/MomentCard";
import { Card } from "@/components/ui/Card";
import { toUserErrorMessage } from "@/lib/errors";
import {
  formatOnThisDayHeading,
  getUtcCalendarParts,
  yearsAgoLabel,
} from "@/lib/moments/on-this-day";
import { getOnThisDayMoments } from "@/lib/moments/queries";
import { hasActiveSearchFilters } from "@/lib/moments/search";
import type { TimelineSearchFilters } from "@/lib/moments/search";

type OnThisDaySectionProps = {
  filters: TimelineSearchFilters;
};

export async function OnThisDaySection({ filters }: OnThisDaySectionProps) {
  if (hasActiveSearchFilters(filters)) {
    return null;
  }

  const today = new Date();
  let moments;

  try {
    moments = await getOnThisDayMoments(today);
  } catch (error) {
    throw new Error(
      toUserErrorMessage(error, "Could not load on-this-day memories."),
    );
  }

  const heading = formatOnThisDayHeading(today);

  return (
    <section className="mb-8" aria-labelledby="on-this-day-heading">
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent">
          <CalendarHeart className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </span>
        <div>
          <h2
            id="on-this-day-heading"
            className="font-display text-lg font-semibold text-ink"
          >
            {heading}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Memories from this date in past years.
          </p>
        </div>
      </div>

      {moments.length > 0 ? (
        <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
          {moments.map((moment, index) => (
            <li
              key={moment.id}
              className="w-[min(100%,18rem)] shrink-0 snap-start animate-fade-in-up sm:w-72"
              style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
            >
              <MomentCard
                moment={moment}
                yearsAgo={yearsAgoLabel(moment.occurred_at, today)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <OnThisDayEmptyState month={getUtcCalendarParts(today).month} />
      )}
    </section>
  );
}

function OnThisDayEmptyState({ month }: { month: number }) {
  const season =
    month >= 3 && month <= 5
      ? "spring"
      : month >= 6 && month <= 8
        ? "summer"
        : month >= 9 && month <= 11
          ? "fall"
          : "winter";

  return (
    <Card
      padding="lg"
      className="border-dashed border-border-strong bg-accent-subtle/40 text-center"
    >
      <p className="font-display text-base font-semibold text-ink">
        No memories from this day yet
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Keep capturing through the {season} — future you will love seeing what
        happened on this date in years past.
      </p>
      <Link
        href="/capture"
        className="mt-4 inline-flex text-sm font-medium text-accent underline-offset-4 transition hover:text-accent-hover hover:underline"
      >
        Capture today&apos;s moment
      </Link>
    </Card>
  );
}
