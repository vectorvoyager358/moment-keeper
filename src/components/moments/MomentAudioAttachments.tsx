"use client";

import { AudioLines, ChevronUp } from "lucide-react";
import { useState } from "react";

import { MediaDownloadButton } from "@/components/moments/MediaDownloadButton";
import { cn } from "@/lib/cn";
import type { MomentMedia } from "@/lib/moments/detail";

type MomentAudioAttachmentsProps = {
  media: MomentMedia[];
  className?: string;
};

export function MomentAudioAttachments({
  media,
  className,
}: MomentAudioAttachmentsProps) {
  const [open, setOpen] = useState(false);
  const label = media.length === 1 ? "voice recording" : "voice recordings";

  if (media.length === 0) {
    return null;
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label={`Open ${media.length} ${label}`}
        aria-expanded="false"
        title={`Open ${label}`}
        onClick={() => setOpen(true)}
        className={cn(
          "relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-border-strong bg-accent-subtle text-accent shadow-sm transition hover:border-accent/50 hover:bg-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 touch-manipulation",
          className,
        )}
      >
        <AudioLines className="h-5 w-5" aria-hidden />
        {media.length > 1 ? (
          <span className="absolute -top-1 -right-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-surface bg-accent px-1 text-[0.625rem] font-bold leading-none text-white">
            {media.length}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <section
      className={cn(
        "w-full rounded-2xl border border-border bg-accent-subtle/25 p-3 sm:p-4",
        className,
      )}
      aria-label={`${media.length} ${label}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent-subtle text-accent">
            <AudioLines className="h-4 w-4" aria-hidden />
          </span>
          <p className="text-sm font-semibold text-ink">
            {media.length === 1 ? "Voice recording" : "Voice recordings"}
          </p>
        </div>
        <button
          type="button"
          aria-label={`Close ${label}`}
          aria-expanded="true"
          title={`Close ${label}`}
          onClick={() => setOpen(false)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <ChevronUp className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="space-y-3">
        {media.map((attachment, index) => {
          const filename =
            attachment.original_filename ?? `voice-recording-${index + 1}`;

          return (
            <div
              key={attachment.id}
              className="rounded-xl border border-border/80 bg-surface/70 p-2"
            >
              {media.length > 1 || attachment.original_filename ? (
                <p className="mb-2 truncate px-1 text-xs font-medium text-muted">
                  {filename}
                </p>
              ) : null}
              <div className="flex min-w-0 items-center gap-2">
                <audio
                  controls
                  src={attachment.signedUrl}
                  aria-label={`Voice recording ${index + 1}: ${filename}`}
                  className="min-w-0 flex-1"
                >
                  Your browser does not support audio playback.
                </audio>
                <MediaDownloadButton
                  src={attachment.signedUrl}
                  filename={filename}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
