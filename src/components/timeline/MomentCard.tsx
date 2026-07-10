import { ImageIcon, Mic, Video } from "lucide-react";
import Link from "next/link";

import { MomentDate } from "@/components/moments/MomentDate";
import { buttonClassName } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { truncateBody } from "@/lib/moments/dates";
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

function MediaTile({ mediaType }: { mediaType: TimelineMoment["mediaType"] }) {
  const Icon =
    mediaType === "video" ? Video : mediaType === "audio" ? Mic : ImageIcon;
  const label =
    mediaType === "video"
      ? "Video moment"
      : mediaType === "audio"
        ? "Voice moment"
        : "Photo moment";

  return (
    <div className="flex aspect-[3/1] items-center justify-center bg-gradient-to-br from-accent-subtle to-tag sm:aspect-[4/1]">
      <div className="flex items-center gap-3 text-accent">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface/80 shadow-sm">
          <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </span>
        <span className="text-sm font-semibold tracking-wide">{label}</span>
      </div>
    </div>
  );
}

export function MomentCard({ moment, yearsAgo }: MomentCardProps) {
  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-border/80 bg-surface shadow-card transition duration-[var(--duration-normal)] hover:-translate-y-1 hover:border-border-strong hover:shadow-card-hover">
      <Link
        href={`/moments/${moment.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40"
      >
        {moment.thumbnailUrl ? (
          <div className="relative overflow-hidden bg-accent-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element -- signed Supabase URLs */}
            <img
              src={moment.thumbnailUrl}
              alt=""
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.025] sm:aspect-[3/2]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        ) : moment.hasMedia ? (
          <MediaTile mediaType={moment.mediaType} />
        ) : null}

        <div className="p-5 sm:p-6">
          {yearsAgo ? (
            <p className="mb-2 font-display text-sm font-semibold text-accent">
              {yearsAgo}
            </p>
          ) : null}
          <div className="flex items-start justify-between gap-4">
            <MomentDate
              iso={moment.occurred_at}
              className="text-xs font-semibold tracking-[0.12em] text-muted uppercase"
            />
            {moment.hasMedia ? (
              <MediaBadge mediaType={moment.mediaType} />
            ) : null}
          </div>

          <p className="mt-3 whitespace-pre-wrap font-display text-[1.05rem] leading-7 text-ink">
            {truncateBody(moment.body)}
          </p>
        </div>
      </Link>

      {moment.tags.length > 0 ? (
        <ul className="-mt-2 flex flex-wrap gap-2 px-5 pb-5 sm:px-6 sm:pb-6">
          {moment.tags.map((tag) => (
            <li key={tag.id}>
              <Link
                href={`/timeline?tag=${encodeURIComponent(tag.id)}`}
                aria-label={`Filter timeline by ${tag.name}`}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <Tag className="hover:bg-accent-subtle hover:text-accent">
                  {tag.name}
                </Tag>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
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
