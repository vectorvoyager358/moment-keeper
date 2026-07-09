import { ImageIcon, Mic, Video } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { formatMomentDate, truncateBody } from "@/lib/moments/dates";
import { cn } from "@/lib/cn";
import type { TimelineMoment } from "@/lib/moments/queries";

type MomentCardProps = {
  moment: TimelineMoment;
  yearsAgo?: string;
};

function MediaBadge({ mediaType }: { mediaType: TimelineMoment["mediaType"] }) {
  if (mediaType === "photo") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2 py-0.5 text-xs font-medium text-accent">
        <ImageIcon className="h-3 w-3" aria-hidden />
        Photo
      </span>
    );
  }

  if (mediaType === "video") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2 py-0.5 text-xs font-medium text-accent">
        <Video className="h-3 w-3" aria-hidden />
        Video
      </span>
    );
  }

  if (mediaType === "audio") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2 py-0.5 text-xs font-medium text-accent">
        <Mic className="h-3 w-3" aria-hidden />
        Audio
      </span>
    );
  }

  return null;
}

export function MomentCard({ moment, yearsAgo }: MomentCardProps) {
  return (
    <Link
      href={`/moments/${moment.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover"
    >
      <article>
        {moment.thumbnailUrl ? (
          <div className="relative overflow-hidden bg-accent-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element -- signed Supabase URLs */}
            <img
              src={moment.thumbnailUrl}
              alt=""
              loading="lazy"
              className="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        ) : null}

        <div className="p-5">
          {yearsAgo ? (
            <p className="mb-2 font-display text-sm font-semibold text-accent">
              {yearsAgo}
            </p>
          ) : null}
          <div className="flex items-start justify-between gap-4">
            <time
              dateTime={moment.occurred_at}
              className="font-display text-sm font-medium text-muted"
            >
              {formatMomentDate(moment.occurred_at)}
            </time>
            {moment.hasMedia ? (
              <MediaBadge mediaType={moment.mediaType} />
            ) : null}
          </div>

          <p className="mt-3 whitespace-pre-wrap leading-relaxed text-ink">
            {truncateBody(moment.body)}
          </p>

          {moment.tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {moment.tags.map((tag) => (
                <li key={tag.id}>
                  <Tag>{tag.name}</Tag>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
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
      className={cn(
        "rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center",
        className,
      )}
    >
      <h2 className="font-display text-xl font-semibold text-ink">
        Your journal is waiting
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Save your first meaningful moment — a few words is enough to start.
      </p>
      <Link href="/capture" className={buttonClassName({ className: "mt-6" })}>
        Capture a moment
      </Link>
    </div>
  );
}
