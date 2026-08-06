import { Heart, ImageIcon, Link2, Mic, Video } from "lucide-react";
import Link from "next/link";

import { MomentDate } from "@/components/moments/MomentDate";
import { MomentLocation } from "@/components/moments/MomentLocation";
import { VideoThumbnail } from "@/components/moments/VideoThumbnail";
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
  /** Give the first visible cover an eager, high-priority request. */
  priorityMedia?: boolean;
  /** Return to an exact browsing context after opening this moment. */
  returnTo?: string;
};

function MediaBadge({
  mediaType,
  attachmentCount,
  overlay = false,
}: {
  mediaType: TimelineMoment["mediaType"];
  attachmentCount: number;
  overlay?: boolean;
}) {
  const extra = attachmentCount > 1 ? ` +${attachmentCount - 1}` : "";
  const badgeClassName = cn(
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
    overlay
      ? "border border-white/20 bg-black/35 text-white shadow-sm backdrop-blur-sm"
      : "bg-accent-subtle text-accent",
  );

  if (mediaType === "photo") {
    return (
      <span className={badgeClassName}>
        <ImageIcon className="h-3 w-3" aria-hidden />
        Photo{extra}
      </span>
    );
  }

  if (mediaType === "video") {
    return (
      <span className={badgeClassName}>
        <Video className="h-3 w-3" aria-hidden />
        Video{extra}
      </span>
    );
  }

  if (mediaType === "audio") {
    return (
      <span className={badgeClassName}>
        <Mic className="h-3 w-3" aria-hidden />
        Voice{extra}
      </span>
    );
  }

  return null;
}

const timelineMediaFrame =
  "relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-accent-subtle to-tag sm:aspect-[16/10]";

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
  priorityMedia = false,
  returnTo,
}: MomentCardProps) {
  const bodySegments = getHighlightedSegments(
    truncateBody(previewBody(moment.body), 120),
    highlightQuery,
  );
  const isVideo = moment.mediaType === "video";
  const imageSrc = isVideo
    ? null
    : preferOriginalPhoto && moment.photoUrl
      ? moment.photoUrl
      : (moment.thumbnailUrl ?? moment.photoUrl);
  const videoPosterSrc = isVideo ? moment.thumbnailUrl : null;
  const imageFallbackSrc =
    !preferOriginalPhoto &&
    moment.thumbnailUrl &&
    moment.photoUrl &&
    moment.thumbnailUrl !== moment.photoUrl
      ? moment.photoUrl
      : null;
  const visibleTags = compact ? moment.tags.slice(0, 3) : moment.tags;
  const hiddenTagCount = moment.tags.length - visibleTags.length;
  const hasVisualCover = Boolean(
    imageSrc || videoPosterSrc || (isVideo && moment.videoUrl),
  );
  const mediaOverlay = hasVisualCover ? (
    <>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/10" />
      {moment.hasMedia ? (
        <span className="absolute top-3 right-3">
          <MediaBadge
            mediaType={moment.mediaType}
            attachmentCount={moment.attachmentCount}
            overlay
          />
        </span>
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
        <MomentDate
          iso={moment.occurred_at}
          className="text-xs font-semibold tracking-[0.12em] text-white/85 uppercase"
        />
        {moment.location ? (
          <MomentLocation
            location={moment.location}
            compact
            className="mt-1 !text-white"
          />
        ) : null}
      </div>
    </>
  ) : null;

  return (
    <article
      className={cn(
        "group w-full min-w-0 max-w-full overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-border/50 transition duration-[var(--duration-normal)] hover:-translate-y-1 hover:shadow-card-hover hover:ring-border-strong/70",
        balanceLayout && "h-full",
      )}
    >
      <Link
        href={
          returnTo
            ? `/moments/${moment.id}?from=${encodeURIComponent(returnTo)}`
            : `/moments/${moment.id}`
        }
        className={cn(
          "block w-full min-w-0 max-w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40",
          balanceLayout && "flex h-full flex-col",
        )}
      >
        {isVideo && (videoPosterSrc || moment.videoUrl) ? (
          <div
            className={cn(
              timelineMediaFrame,
              "w-full min-w-0 max-w-full",
              compact && "h-[clamp(7rem,22svh,10rem)] sm:h-auto",
            )}
          >
            <VideoThumbnail
              src={moment.videoUrl}
              posterSrc={videoPosterSrc}
              fill
            />
            {mediaOverlay}
          </div>
        ) : imageSrc ? (
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
                loading={priorityMedia ? "eager" : "lazy"}
                fetchPriority={priorityMedia ? "high" : "auto"}
                decoding="async"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
              />
            ) : (
              <TimelineMediaImage
                src={imageSrc}
                fallbackSrc={imageFallbackSrc}
                fallbackRequestUrl={
                  !preferOriginalPhoto &&
                  moment.mediaType === "photo" &&
                  moment.thumbnailUrl
                    ? `/api/moments/${moment.id}/media-fallback`
                    : null
                }
                priority={priorityMedia}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
              />
            )}
            {mediaOverlay}
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
            {!hasVisualCover ? (
              <div className="min-w-0">
                <MomentDate
                  iso={moment.occurred_at}
                  className="text-xs font-semibold tracking-[0.12em] text-muted uppercase"
                />
                {moment.location ? (
                  <MomentLocation
                    location={moment.location}
                    compact
                    className="mt-1"
                  />
                ) : null}
              </div>
            ) : (
              <span />
            )}
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
              {moment.hasMedia && !hasVisualCover ? (
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

          <p
            className={cn(
              "max-w-full min-w-0 overflow-hidden font-display text-[1.05rem] leading-7 text-ink",
              compact ? "mt-2 line-clamp-2" : "mt-3 line-clamp-3",
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
        "rounded-3xl border border-dashed border-border-strong bg-surface p-10 text-center",
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
