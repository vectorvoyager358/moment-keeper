"use client";

import { useState } from "react";

import { MediaPreviewOverlay } from "@/components/moments/MediaPreviewOverlay";
import type { MomentMedia } from "@/lib/moments/detail";

type MomentMediaDisplayProps = {
  media: MomentMedia;
};

export function MomentMediaDisplay({ media }: MomentMediaDisplayProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  if (media.media_type === "photo") {
    const alt = media.original_filename ?? "Moment attachment";

    return (
      <>
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
          className="block w-full cursor-zoom-in touch-manipulation rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label="View photo full screen"
        >
          {/* Signed Supabase URLs are short-lived; next/image is not used here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media.signedUrl}
            alt={alt}
            draggable={false}
            className="pointer-events-none max-h-[34rem] w-full rounded-2xl bg-accent-subtle object-contain select-none"
          />
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
        className="max-h-[34rem] w-full rounded-2xl bg-black"
      >
        Your browser does not support video playback.
      </video>
    );
  }

  return (
    <audio controls src={media.signedUrl} className="w-full">
      Your browser does not support audio playback.
    </audio>
  );
}
