"use client";

import { AudioLines, ChevronUp, Maximize2 } from "lucide-react";
import { useState } from "react";

import { MediaPreviewOverlay } from "@/components/moments/MediaPreviewOverlay";
import { MediaDownloadButton } from "@/components/moments/MediaDownloadButton";
import { TimelineMediaImage } from "@/components/timeline/TimelineMediaImage";
import { cn } from "@/lib/cn";
import type { MomentMedia } from "@/lib/moments/detail";

type MomentMediaDisplayProps = {
  media: MomentMedia;
  mode?: "inline" | "viewer";
  className?: string;
  fallbackRequestUrl?: string;
  onOpenPreview?: () => void;
  priority?: boolean;
};

export function MomentMediaDisplay({
  media,
  mode = "inline",
  className,
  fallbackRequestUrl,
  onOpenPreview,
  priority = false,
}: MomentMediaDisplayProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const viewer = mode === "viewer";
  const openPreview = onOpenPreview ?? (() => setPreviewOpen(true));

  if (media.media_type === "photo") {
    const alt = media.original_filename ?? "Moment attachment";

    return (
      <>
        <div className={cn(viewer && "relative h-full w-full", className)}>
          <div
            role="button"
            tabIndex={0}
            onClick={openPreview}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openPreview();
              }
            }}
            className={cn(
              "relative block w-full cursor-zoom-in touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
              viewer ? "h-full" : "rounded-2xl",
            )}
            aria-label="View photo full screen"
          >
            <TimelineMediaImage
              src={media.signedUrl}
              fallbackRequestUrl={fallbackRequestUrl}
              alt={alt}
              priority={priority}
              className={cn(
                "pointer-events-none w-full select-none",
                viewer
                  ? "absolute inset-0 h-full object-cover"
                  : "relative max-h-[46svh] rounded-2xl bg-accent-subtle object-contain sm:max-h-[34rem]",
              )}
            />
          </div>
        </div>
        {!onOpenPreview ? (
          <MediaPreviewOverlay
            src={media.signedUrl}
            alt={alt}
            filename={media.original_filename ?? "moment-photo"}
            fallbackRequestUrl={fallbackRequestUrl}
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
          />
        ) : null}
      </>
    );
  }

  if (media.media_type === "video") {
    const videoName = media.original_filename ?? "moment-video";

    return (
      <>
        <div
          className={cn(
            "relative w-full bg-black",
            viewer ? "h-full" : "max-h-[46svh] rounded-2xl sm:max-h-[34rem]",
            className,
          )}
        >
          <video
            controls
            src={media.signedUrl}
            playsInline
            className={cn(
              "w-full bg-black",
              viewer
                ? "h-full object-cover"
                : "max-h-[46svh] rounded-2xl sm:max-h-[34rem]",
            )}
          >
            Your browser does not support video playback.
          </video>
          <button
            type="button"
            aria-label="View video full screen"
            title="Open video preview"
            onClick={openPreview}
            className="absolute right-3 bottom-12 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <Maximize2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {!onOpenPreview ? (
          <MediaPreviewOverlay
            src={media.signedUrl}
            alt={videoName}
            filename={videoName}
            mediaType="video"
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
          />
        ) : null}
      </>
    );
  }

  const audioName = media.original_filename ?? "Voice memo";

  if (!audioOpen) {
    return (
      <button
        type="button"
        aria-label={`Open voice memo player for ${audioName}`}
        title="Open voice memo"
        aria-expanded="false"
        onClick={() => setAudioOpen(true)}
        className={cn(
          "inline-flex h-12 w-12 items-center justify-center rounded-full border border-border-strong bg-accent-subtle text-accent shadow-sm transition hover:border-accent/50 hover:bg-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 touch-manipulation",
          className,
        )}
      >
        <AudioLines className="h-5 w-5" aria-hidden />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center gap-2 rounded-2xl border border-border bg-accent-subtle/35 p-2",
        className,
      )}
    >
      <audio
        controls
        src={media.signedUrl}
        aria-label={`Voice memo player for ${audioName}`}
        className="min-w-0 flex-1"
      >
        Your browser does not support audio playback.
      </audio>
      <MediaDownloadButton src={media.signedUrl} filename={audioName} />
      <button
        type="button"
        aria-label={`Close voice memo player for ${audioName}`}
        title="Close voice memo"
        aria-expanded="true"
        onClick={() => setAudioOpen(false)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <ChevronUp className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
