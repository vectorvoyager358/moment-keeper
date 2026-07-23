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

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <p className="shrink-0 text-sm whitespace-nowrap text-muted">
          {moments.length} {moments.length === 1 ? "attachment" : "attachments"}
        </p>
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div
            className="flex w-max gap-1 rounded-xl border border-border bg-surface p-1"
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
      </div>

      {moments.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
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
                  href={`/moments/${moment.momentId}`}
                  className="group relative flex aspect-square overflow-hidden rounded-2xl border border-border bg-accent-subtle shadow-card transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
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
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface/75 shadow-sm">
                        <Icon className="h-6 w-6" aria-hidden />
                      </span>
                    </span>
                  )}

                  <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
                  <span className="relative z-10 mt-auto w-full min-w-0 p-3 text-white sm:p-4">
                    <p className="flex min-h-4 items-center gap-1.5 text-[0.65rem] font-semibold tracking-wide uppercase opacity-85 sm:text-xs">
                      <Icon className="h-3 w-3 shrink-0" aria-hidden />
                      <span className="min-w-0 truncate">{mediaLabel}</span>
                    </p>
                    <p className="mt-1 min-h-5 truncate font-display text-sm sm:text-base">
                      {truncateBody(moment.body, 48)}
                    </p>
                    {moment.location ? (
                      <p className="mt-1 min-h-4 truncate text-[0.65rem] opacity-85 sm:text-xs">
                        {moment.location}
                      </p>
                    ) : null}
                    <MomentDate
                      iso={moment.occurred_at}
                      compact
                      className="mt-1 block min-h-4 truncate text-[0.65rem] opacity-75 sm:text-xs"
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
            No photos or voice memos yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Next time you keep a moment, add something you can see or hear.
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
