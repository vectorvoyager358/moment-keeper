"use client";

import { ArrowLeft, Images, MapPin, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { DeleteMomentButton } from "@/components/moments/DeleteMomentButton";
import { FavoriteMomentButton } from "@/components/moments/FavoriteMomentButton";
import { MomentAudioAttachments } from "@/components/moments/MomentAudioAttachments";
import { MomentDate } from "@/components/moments/MomentDate";
import { MomentDetailNav } from "@/components/moments/MomentDetailNav";
import { MomentLink } from "@/components/moments/MomentLink";
import { MediaPreviewOverlay } from "@/components/moments/MediaPreviewOverlay";
import { MomentMediaDisplay } from "@/components/moments/MomentMediaDisplay";
import { RichTextContent } from "@/components/moments/RichTextContent";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import type { MomentMedia } from "@/lib/moments/detail";
import type { MomentDetail } from "@/lib/moments/queries";
import { memoryThemeLabel } from "@/lib/moments/themes";

type MomentDetailViewProps = {
  moment: MomentDetail;
  earlierId?: string | null;
  laterId?: string | null;
  onEdit: () => void;
};

export function MomentDetailView({
  moment,
  earlierId = null,
  laterId = null,
  onEdit,
}: MomentDetailViewProps) {
  const visualMedia = moment.media.filter(
    (media): media is MomentMedia & { media_type: "photo" | "video" } =>
      media.media_type === "photo" || media.media_type === "video",
  );
  const audioMedia = moment.media.filter(
    (media) => media.media_type === "audio",
  );
  const hasVisualMedia = visualMedia.length > 0;
  const mediaOrderKey = visualMedia.map((media) => media.id).join(":");
  const mediaCarouselRef = useRef<HTMLDivElement>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const previewItems = visualMedia.map((media) => ({
    id: media.id,
    src: media.signedUrl,
    alt: media.original_filename ?? "Moment attachment",
    filename:
      media.original_filename ??
      (media.media_type === "video" ? "moment-video" : "moment-photo"),
    mediaType: media.media_type,
    fallbackRequestUrl:
      media.media_type === "photo"
        ? `/api/moments/${moment.id}/media-fallback?mediaId=${encodeURIComponent(media.id)}`
        : undefined,
  }));

  useEffect(() => {
    if (mediaCarouselRef.current) {
      mediaCarouselRef.current.scrollLeft = 0;
    }
  }, [mediaOrderKey]);

  const overlayActions = (
    <div className="flex items-center gap-2">
      <FavoriteMomentButton
        momentId={moment.id}
        initialFavorite={moment.is_favorite}
        appearance="overlay"
      />
      <Button
        type="button"
        variant="secondary"
        aria-label="Edit moment"
        title="Edit moment"
        className="h-11 w-11 rounded-full !border-white/20 !bg-ink/50 px-0 !text-white shadow-lg backdrop-blur-md hover:!bg-ink/65 hover:!text-white"
        onClick={onEdit}
      >
        <SlidersHorizontal className="h-5 w-5" aria-hidden />
      </Button>
      <DeleteMomentButton
        momentId={moment.id}
        className="!border-white/20 !bg-ink/50 !text-white shadow-lg backdrop-blur-md hover:!border-danger/60 hover:!bg-danger/85 hover:!text-white"
      />
    </div>
  );

  return (
    <>
      <article
        className={
          hasVisualMedia
            ? "overflow-hidden bg-surface sm:rounded-[2rem] sm:border sm:border-border sm:shadow-card lg:grid lg:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.75fr)] lg:overflow-visible lg:border-0 lg:bg-transparent lg:shadow-none"
            : "mx-auto max-w-3xl overflow-hidden bg-surface sm:rounded-[2rem] sm:border sm:border-border sm:shadow-card"
        }
      >
        {hasVisualMedia ? (
          <section
            aria-label="Moment media"
            className="relative isolate h-[min(64svh,42rem)] min-h-[28rem] overflow-hidden bg-[#1d1814] sm:h-[min(72svh,48rem)] sm:min-h-[34rem] lg:sticky lg:top-24 lg:h-[calc(100svh-8rem)] lg:max-h-[52rem] lg:rounded-[2rem] lg:shadow-[0_18px_60px_rgba(42,33,24,0.18)]"
          >
            <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between bg-gradient-to-b from-black/50 via-black/15 to-transparent p-4 pb-14 sm:p-5 sm:pb-16">
              <Link
                href="/timeline"
                aria-label="Back to your journal"
                title="Back to your journal"
                className={buttonClassName({
                  variant: "secondary",
                  className:
                    "h-11 w-11 rounded-full !border-white/20 !bg-ink/50 px-0 !text-white shadow-lg backdrop-blur-md hover:!bg-ink/65 hover:!text-white",
                })}
              >
                <ArrowLeft className="h-5 w-5" aria-hidden />
              </Link>
              {overlayActions}
            </div>

            <div
              ref={mediaCarouselRef}
              data-testid="moment-media-carousel"
              className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {visualMedia.map((media, index) => (
                <div
                  key={`${media.id}:${media.display_order}`}
                  className="h-full w-full shrink-0 snap-center snap-always"
                >
                  <MomentMediaDisplay
                    media={media}
                    mode="viewer"
                    priority={index === 0}
                    fallbackRequestUrl={
                      media.media_type === "photo"
                        ? `/api/moments/${moment.id}/media-fallback?mediaId=${encodeURIComponent(media.id)}`
                        : undefined
                    }
                    onOpenPreview={() => setPreviewIndex(index)}
                  />
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 bg-gradient-to-t from-black/65 via-black/20 to-transparent p-5 pt-24 text-white sm:p-6 sm:pt-28">
              <div className="min-w-0">
                {moment.location ? (
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold drop-shadow-sm sm:text-base">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">{moment.location}</span>
                  </p>
                ) : null}
                <MomentDate
                  iso={moment.occurred_at}
                  detail
                  className="mt-1 block text-xs font-medium text-white/80 drop-shadow-sm sm:text-sm"
                />
              </div>
              {visualMedia.length > 1 ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
                  <Images className="h-3.5 w-3.5" aria-hidden />
                  {visualMedia.length}
                </span>
              ) : null}
            </div>
          </section>
        ) : null}

        <section
          className={
            hasVisualMedia
              ? "min-w-0 p-5 sm:p-8 lg:flex lg:min-h-[calc(100svh-8rem)] lg:flex-col lg:px-9 lg:py-10"
              : "min-w-0 p-5 sm:p-8 lg:px-9 lg:py-10"
          }
        >
          {!hasVisualMedia ? (
            <header className="mb-8 flex items-start justify-between gap-4">
              <Link
                href="/timeline"
                aria-label="Back to your journal"
                title="Back to your journal"
                className={buttonClassName({
                  variant: "secondary",
                  className: "h-11 w-11 rounded-full px-0",
                })}
              >
                <ArrowLeft className="h-5 w-5" aria-hidden />
              </Link>
              <div className="flex items-center gap-2">
                <FavoriteMomentButton
                  momentId={moment.id}
                  initialFavorite={moment.is_favorite}
                />
                <Button
                  type="button"
                  variant="secondary"
                  aria-label="Edit moment"
                  title="Edit moment"
                  className="h-11 w-11 rounded-full px-0"
                  onClick={onEdit}
                >
                  <SlidersHorizontal className="h-5 w-5" aria-hidden />
                </Button>
                <DeleteMomentButton momentId={moment.id} />
              </div>
            </header>
          ) : null}

          {!hasVisualMedia ? (
            <div className="mb-6">
              {moment.location ? (
                <p className="flex items-center gap-2 font-display text-xl font-semibold text-ink sm:text-2xl">
                  <MapPin className="h-5 w-5 text-accent" aria-hidden />
                  {moment.location}
                </p>
              ) : null}
              <MomentDate
                iso={moment.occurred_at}
                detail
                className="mt-1.5 block text-sm text-muted"
              />
            </div>
          ) : null}

          <RichTextContent body={moment.body} content={moment.body_content} />

          {moment.link_url ? (
            <div className="mt-7">
              <MomentLink url={moment.link_url} />
            </div>
          ) : null}

          {audioMedia.length > 0 ? (
            <MomentAudioAttachments media={audioMedia} className="mt-7" />
          ) : null}

          {moment.themes.length > 0 || moment.tags.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-2 border-t border-border/80 pt-6">
              {moment.themes.map((theme) => (
                <Link
                  key={theme}
                  href={`/timeline?theme=${theme}`}
                  className="inline-flex rounded-full bg-accent-subtle px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  {memoryThemeLabel(theme)}
                </Link>
              ))}
              {moment.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/timeline?tag=${encodeURIComponent(tag.id)}`}
                  aria-label={`See moments tagged ${tag.name}`}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <Tag className="px-3 py-1.5 hover:bg-accent-subtle hover:text-accent">
                    {tag.name}
                  </Tag>
                </Link>
              ))}
            </div>
          ) : null}

          <div className={hasVisualMedia ? "mt-auto pt-8" : "pt-8"}>
            <MomentDetailNav earlierId={earlierId} laterId={laterId} />
          </div>
        </section>
      </article>
      <MediaPreviewOverlay
        items={previewItems}
        initialIndex={previewIndex ?? 0}
        open={previewIndex !== null}
        onClose={() => setPreviewIndex(null)}
      />
    </>
  );
}
