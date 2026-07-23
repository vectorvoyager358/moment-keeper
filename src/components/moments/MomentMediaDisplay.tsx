"use client";

import { useState } from "react";

import { MediaPreviewOverlay } from "@/components/moments/MediaPreviewOverlay";
import { cn } from "@/lib/cn";
import type { MomentMedia } from "@/lib/moments/detail";

type MomentMediaDisplayProps = {
  media: MomentMedia;
  mode?: "inline" | "viewer";
  className?: string;
};

export function MomentMediaDisplay({
  media,
  mode = "inline",
  className,
}: MomentMediaDisplayProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const viewer = mode === "viewer";

  if (media.media_type === "photo") {
    const alt = media.original_filename ?? "Moment attachment";

    return (
      <>
        <div className={cn(viewer && "relative h-full w-full", className)}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setPreviewOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setPreviewOpen(true);
              }
            }}
            className={cn(
              "relative block w-full cursor-zoom-in touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
              viewer ? "h-full" : "rounded-2xl",
            )}
            aria-label="View photo full screen"
          >
            {/* Signed Supabase URLs are short-lived; next/image is not used here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media.signedUrl}
              alt={alt}
              draggable={false}
              className={cn(
                "pointer-events-none w-full select-none",
                viewer
                  ? "absolute inset-0 h-full object-cover"
                  : "relative max-h-[46svh] rounded-2xl bg-accent-subtle object-contain sm:max-h-[34rem]",
              )}
            />
          </div>
        </div>
        <MediaPreviewOverlay
          src={media.signedUrl}
          alt={alt}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      </>
    );
  }

  if (media.media_type === "video") {
    return (
      <video
        controls
        src={media.signedUrl}
        playsInline
        className={cn(
          "w-full bg-black",
          viewer
            ? "h-full object-cover"
            : "max-h-[46svh] rounded-2xl sm:max-h-[34rem]",
          className,
        )}
      >
        Your browser does not support video playback.
      </video>
    );
  }

  return (
    <audio controls src={media.signedUrl} className={cn("w-full", className)}>
      Your browser does not support audio playback.
    </audio>
  );
}
