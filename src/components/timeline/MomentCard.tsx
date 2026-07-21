import { Heart, ImageIcon, Link2, Mic, Video } from "lucide-react";
import Link from "next/link";

import { MomentDate } from "@/components/moments/MomentDate";
import { MomentLocation } from "@/components/moments/MomentLocation";
import { TimelineMediaImage } from "@/components/timeline/TimelineMediaImage";
import { buttonClassName } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { truncateBody } from "@/lib/moments/dates";
import { cn } from "@/lib/cn";
import type { TimelineMoment } from "@/lib/moments/queries";
import { getHighlightedSegments } from "@/lib/moments/search";

type MomentCardProps = {
  moment: TimelineMoment;
  yearsAgo?: string;
  highlightQuery?: string;
  /** Use the original photo for surfaces that must work without client JS. */
  preferOriginalPhoto?: boolean;
  /** Keep the preview within a mobile viewport and summarize overflow. */
  compact?: boolean;
  /** Reserve a media-sized header so text-only cards align in grids/carousels. */
  balanceLayout?: boolean;
};

function MediaBadge({
  mediaType,
  attachmentCount,
}: {
  mediaType: TimelineMoment["mediaType"];
  attachmentCount: number;
}) {
  const extra = attachmentCount > 1 ? ` +${attachmentCount - 1}` : "";

  if (mediaType === "photo") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2 py-0.5 text-xs font-medium text-accent">
        <ImageIcon className="h-3 w-3" aria-hidden />
        Photo{extra}
      </span>
    );
  }

  if (mediaType === "video") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2 py-0.5 text-xs font-medium text-accent">
        <Video className="h-3 w-3" aria-hidden />
        Video{extra}
      </span>
    );
  }

  if (mediaType === "audio") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2 py-0.5 text-xs font-medium text-accent">
        <Mic className="h-3 w-3" aria-hidden />
        Voice{extra}
      </span>
    );
  }

  return null;
}

const timelineMediaFrame =
  "relative h-52 overflow-hidden bg-gradient-to-br from-accent-subtle to-tag sm:h-auto sm:aspect-[3/2]";

function MediaTile({
  mediaType,
  compact,
}: {
  mediaType: TimelineMoment["mediaType"];
  compact: boolean;
}) {
  const Icon =
    mediaType === "video" ? Video : mediaType === "audio" ? Mic : ImageIcon;
  const label =
    mediaType === "video"
      ? "A video"
      : mediaType === "audio"
        ? "A voice memo"
        : "A photo";

  return (
    <div
      className={cn(
        timelineMediaFrame,
        "flex items-center justify-center",
        compact && "h-[clamp(7rem,22svh,10rem)] sm:h-auto",
      )}
    >
      <div className="flex items-center gap-3 text-accent">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface/80 shadow-sm">
          <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </span>
        <span className="text-sm font-semibold tracking-wide">{label}</span>
      </div>
    </div>
  );
}

function BalancedMediaPlaceholder({
  mediaType,
}: {
  mediaType: TimelineMoment["mediaType"];
}) {
  const Icon =
    mediaType === "video" ? Video : mediaType === "audio" ? Mic : ImageIcon;

  return (
    <div className={timelineMediaFrame} aria-hidden>
      {mediaType ? (
        <div className="flex h-full items-center justify-center text-accent/70">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface/80 shadow-sm">
            <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          </span>
        </div>
      ) : null}
    </div>
  );
}

function previewBody(body: string): string {
  const firstLine =
    body.split(/\r?\n/).find((line) => line.trim().length > 0) ?? body;
  return firstLine.replace(/\s+/g, " ").trim();
}

export function MomentCard({
  moment,
  yearsAgo,
  highlightQuery = "",
  preferOriginalPhoto = false,
  compact = false,
  balanceLayout = false,
}: MomentCardProps) {
  const bodySegments = getHighlightedSegments(
    truncateBody(previewBody(moment.body), 120),
    highlightQuery,
  );
  const imageSrc =
    preferOriginalPhoto && moment.photoUrl
      ? moment.photoUrl
      : (moment.thumbnailUrl ?? moment.photoUrl);
  const imageFallbackSrc =
    !preferOriginalPhoto &&
    moment.thumbnailUrl &&
    moment.photoUrl &&
    moment.thumbnailUrl !== moment.photoUrl
      ? moment.photoUrl
      : null;
  const visibleTags = compact ? moment.tags.slice(0, 3) : moment.tags;
  const hiddenTagCount = moment.tags.length - visibleTags.length;

  return (
    <article
      className={cn(
        "group w-full min-w-0 max-w-full overflow-hidden rounded-[1.5rem] border border-border/80 bg-surface shadow-card transition duration-[var(--duration-normal)] hover:-translate-y-1 hover:border-border-strong hover:shadow-card-hover",
        balanceLayout && "h-full",
      )}
    >
      <Link
        href={`/moments/${moment.id}`}
        className={cn(
          "block w-full min-w-0 max-w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40",
          balanceLayout && "flex h-full flex-col",
        )}
      >
        {imageSrc ? (
          <div
            className={cn(
              timelineMediaFrame,
              "w-full min-w-0 max-w-full bg-accent-subtle",
              compact && "h-[clamp(7rem,22svh,10rem)] sm:h-auto",
            )}
          >
            {preferOriginalPhoto && moment.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL
              <img
                src={moment.photoUrl}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
              />
            ) : (
              <TimelineMediaImage
                src={imageSrc}
                fallbackSrc={imageFallbackSrc}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
              />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        ) : balanceLayout ? (
          <BalancedMediaPlaceholder
            mediaType={moment.hasMedia ? moment.mediaType : null}
          />
        ) : moment.hasMedia ? (
          <MediaTile mediaType={moment.mediaType} compact={compact} />
        ) : null}

        <div
          className={cn(
            "min-w-0 max-w-full overflow-hidden",
            compact ? "p-4 sm:p-5" : "p-5 sm:p-6",
            balanceLayout && "flex-1",
          )}
        >
          {yearsAgo ? (
            <p className="mb-2 font-display text-sm font-semibold text-accent">
              {yearsAgo}
            </p>
          ) : null}
          <div className="flex min-w-0 items-start justify-between gap-4">
            <MomentDate
              iso={moment.occurred_at}
              className="text-xs font-semibold tracking-[0.12em] text-muted uppercase"
            />
            <span className="flex items-center gap-2">
              {moment.isFavorite ? (
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent"
                  title="Favorite"
                >
                  <Heart className="h-3.5 w-3.5 fill-current" aria-hidden />
                  <span className="sr-only">Favorite</span>
                </span>
              ) : null}
              {moment.hasMedia ? (
                <MediaBadge
                  mediaType={moment.mediaType}
                  attachmentCount={moment.attachmentCount}
                />
              ) : null}
              {moment.linkUrl ? (
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent"
                  title="Has a link"
                >
                  <Link2 className="h-3.5 w-3.5" aria-hidden />
                  <span className="sr-only">Has a link</span>
                </span>
              ) : null}
            </span>
          </div>
          {moment.location ? (
            <MomentLocation
              location={moment.location}
              compact
              className="mt-1"
            />
          ) : null}

          <p
            className={cn(
              "max-w-full min-w-0 overflow-hidden truncate font-display text-[1.05rem] leading-7 text-ink",
              compact ? "mt-2" : "mt-3",
            )}
          >
            {bodySegments.map((segment, index) =>
              segment.highlighted ? (
                <mark
                  key={`${segment.text}-${index}`}
                  className="rounded bg-accent-subtle px-0.5 text-ink"
                >
                  {segment.text}
                </mark>
              ) : (
                segment.text
              ),
            )}
          </p>
        </div>
      </Link>

      {visibleTags.length > 0 ? (
        <ul
          className={cn(
            "-mt-2 flex gap-2",
            compact
              ? "flex-nowrap overflow-hidden px-4 pb-4 sm:px-5 sm:pb-5"
              : "flex-wrap px-5 pb-5 sm:px-6 sm:pb-6",
          )}
        >
          {visibleTags.map((tag) => (
            <li key={tag.id}>
              <Link
                href={`/timeline?tag=${encodeURIComponent(tag.id)}`}
                aria-label={`See moments tagged ${tag.name}`}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <Tag className="hover:bg-accent-subtle hover:text-accent">
                  {tag.name}
                </Tag>
              </Link>
            </li>
          ))}
          {hiddenTagCount > 0 ? (
            <li className="shrink-0">
              <Tag>+{hiddenTagCount}</Tag>
            </li>
          ) : null}
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
        A few honest words are enough to begin.
      </p>
      <Link href="/capture" className={buttonClassName({ className: "mt-6" })}>
        Capture your first moment
      </Link>
    </div>
  );
}
