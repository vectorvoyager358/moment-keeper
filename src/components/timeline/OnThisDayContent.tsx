import { CalendarHeart } from "lucide-react";
import Link from "next/link";

import { MomentCard } from "@/components/timeline/MomentCard";
import { Card } from "@/components/ui/Card";
import {
  formatOnThisDayHeading,
  getLocalCalendarParts,
  yearsAgoLabel,
} from "@/lib/moments/on-this-day";
import type { TimelineMoment } from "@/lib/moments/timeline";

export function OnThisDayContent({
  moments,
  todayIso,
  timeZone,
  preview = false,
}: {
  moments: TimelineMoment[];
  todayIso: string;
  timeZone: string;
  preview?: boolean;
}) {
  const today = new Date(todayIso);
  const heading = formatOnThisDayHeading(today, timeZone);

  return (
    <section
      className={preview ? "mb-0" : "mb-8"}
      aria-labelledby="on-this-day-heading"
    >
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
            A look back at this date, year by year.
          </p>
        </div>
      </div>

      {moments.length > 0 ? (
        <ul className="-mx-4 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-4 pb-2">
          {moments.map((moment, index) => (
            <li
              key={moment.id}
              className="h-full w-[min(100%,18rem)] shrink-0 snap-start animate-fade-in-up sm:w-72"
              style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
            >
              <MomentCard
                moment={moment}
                yearsAgo={yearsAgoLabel(moment.occurred_at, today, timeZone)}
                balanceLayout
              />
            </li>
          ))}
        </ul>
      ) : (
        <OnThisDayEmptyState
          month={getLocalCalendarParts(today, timeZone).month}
        />
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
        Nothing from this day — yet
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Keep a few moments through the {season} — future you will love finding
        them here.
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
