import Link from "next/link";

import { formatMomentDate, truncateBody } from "@/lib/moments/dates";
import type { TimelineMoment } from "@/lib/moments/queries";

type MomentCardProps = {
  moment: TimelineMoment;
};

export function MomentCard({ moment }: MomentCardProps) {
  return (
    <Link
      href={`/moments/${moment.id}`}
      className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <article>
        <div className="flex items-start justify-between gap-4">
          <time
            dateTime={moment.occurred_at}
            className="text-sm text-zinc-500 dark:text-zinc-400"
          >
            {formatMomentDate(moment.occurred_at)}
          </time>
          {moment.hasMedia ? (
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Media
            </span>
          ) : null}
        </div>

        <p className="mt-3 whitespace-pre-wrap text-zinc-900 dark:text-zinc-50">
          {truncateBody(moment.body)}
        </p>

        {moment.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {moment.tags.map((tag) => (
              <li
                key={tag.id}
                className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {tag.name}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </Link>
  );
}

type TimelineEmptyStateProps = {
  className?: string;
};

export function TimelineEmptyState({ className }: TimelineEmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900 ${className ?? ""}`}
    >
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
        No moments yet
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Save your first meaningful moment — it only takes a few seconds.
      </p>
      <Link
        href="/capture"
        className="mt-6 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Capture a moment
      </Link>
    </div>
  );
}
