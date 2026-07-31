import { ImageIcon, Mic, Video } from "lucide-react";
import Link from "next/link";

import { MomentDate } from "@/components/moments/MomentDate";
import { VideoThumbnail } from "@/components/moments/VideoThumbnail";
import { TimelineMediaImage } from "@/components/timeline/TimelineMediaImage";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { MediaType } from "@/lib/database.types";
import { toUserErrorMessage } from "@/lib/errors";
import { truncateBody } from "@/lib/moments/dates";
import { getMediaGalleryMoments } from "@/lib/moments/queries";

type MediaGalleryProps = {
  mediaType: MediaType | null;
};

const FILTERS: Array<{ value: MediaType | null; label: string }> = [
  { value: null, label: "Everything" },
  { value: "photo", label: "Photos" },
  { value: "video", label: "Videos" },
  { value: "audio", label: "Voice" },
];

export async function MediaGallery({ mediaType }: MediaGalleryProps) {
  let moments;

  try {
    moments = await getMediaGalleryMoments(mediaType);
  } catch (error) {
    throw new Error(
      toUserErrorMessage(error, "Could not load your media gallery."),
    );
  }

  const returnTo = mediaType
    ? `/browse?view=media&media=${mediaType}`
    : "/browse?view=media";

  return (
    <div>
      <div className="sticky top-[max(0.5rem,env(safe-area-inset-top))] z-20 -mx-1 mb-4 flex items-center gap-3 rounded-2xl bg-paper/95 px-1 py-2 md:top-20">
        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div
            className="flex w-max gap-1 rounded-xl bg-surface p-1 ring-1 ring-border/60"
            aria-label="Filter media"
          >
            {FILTERS.map((filter) => {
              const active = filter.value === mediaType;
              const href = filter.value
                ? `/browse?view=media&media=${filter.value}`
                : "/browse?view=media";

              return (
                <Link
                  key={filter.label}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                    active
                      ? "bg-accent text-white"
                      : "text-muted hover:bg-accent-subtle hover:text-ink",
                  )}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        </div>
        <p className="shrink-0 text-xs font-medium whitespace-nowrap text-muted sm:text-sm">
          {moments.length} {moments.length === 1 ? "item" : "items"}
        </p>
      </div>

      {moments.length > 0 ? (
        <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:grid-cols-5">
          {moments.map((moment) => {
            const Icon =
              moment.mediaType === "video"
                ? Video
                : moment.mediaType === "audio"
                  ? Mic
                  : ImageIcon;
            const mediaLabel =
              moment.mediaType === "audio"
                ? "Voice"
                : moment.mediaType === "video"
                  ? "Video"
                  : "Photo";

            return (
              <li key={moment.id}>
                <Link
                  href={`/moments/${moment.momentId}?from=${encodeURIComponent(returnTo)}`}
                  aria-label={`${mediaLabel}: ${truncateBody(moment.body, 80)}`}
                  className="group relative flex aspect-square overflow-hidden rounded-xl bg-accent-subtle shadow-sm ring-1 ring-border/40 transition hover:z-10 hover:scale-[1.025] hover:shadow-card-hover hover:ring-border-strong focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:rounded-2xl"
                >
                  {moment.thumbnailUrl || moment.photoUrl ? (
                    <TimelineMediaImage
                      src={moment.thumbnailUrl ?? moment.photoUrl ?? ""}
                      fallbackSrc={
                        moment.thumbnailUrl &&
                        moment.photoUrl &&
                        moment.thumbnailUrl !== moment.photoUrl
                          ? moment.photoUrl
                          : null
                      }
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : moment.videoUrl ? (
                    <VideoThumbnail
                      src={moment.videoUrl}
                      fill
                      className="transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent-subtle to-tag text-accent">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface/80 shadow-sm sm:h-14 sm:w-14">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                      </span>
                    </span>
                  )}

                  <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
                  <span className="absolute top-2 right-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/35 text-white shadow-sm">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="relative z-10 mt-auto w-full min-w-0 p-2.5 text-white sm:p-3">
                    <span className="sr-only">
                      {truncateBody(moment.body, 80)}
                    </span>
                    <MomentDate
                      iso={moment.occurred_at}
                      compact
                      className="block truncate text-[0.625rem] font-semibold tracking-wide text-white/90 uppercase sm:text-xs"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <Card
          padding="lg"
          className="border-dashed border-border-strong text-center"
        >
          <p className="font-display text-lg font-semibold text-ink">
            No media here yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Try another filter, or add something you can see or hear to your
            next moment.
          </p>
          <Link
            href="/capture"
            className="mt-5 inline-flex text-sm font-medium text-accent hover:underline"
          >
            Capture a moment with media
          </Link>
        </Card>
      )}
    </div>
  );
}
