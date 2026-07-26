"use client";

import { X } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { MediaDownloadButton } from "@/components/moments/MediaDownloadButton";

type MediaPreviewOverlayProps = {
  src: string;
  alt: string;
  filename: string;
  mediaType?: "photo" | "video";
  open: boolean;
  onClose: () => void;
};

function subscribeToMounted() {
  return () => {};
}

export function MediaPreviewOverlay({
  src,
  alt,
  filename,
  mediaType = "photo",
  open,
  onClose,
}: MediaPreviewOverlayProps) {
  const mounted = useSyncExternalStore(
    subscribeToMounted,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || !mounted) {
    return null;
  }

  const mediaLabel = mediaType === "video" ? "video" : "photo";

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/92 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        className="absolute inset-0"
        aria-label={`Close ${mediaLabel} preview`}
        onClick={onClose}
      />
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-20 flex items-center gap-2">
        <MediaDownloadButton
          src={src}
          filename={filename}
          appearance="overlay"
        />
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 touch-manipulation"
          aria-label={`Close ${mediaLabel} preview`}
          onClick={onClose}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
      {mediaType === "video" ? (
        <video
          controls
          src={src}
          playsInline
          aria-label={alt}
          className="relative z-10 max-h-full max-w-full rounded-lg object-contain shadow-2xl"
        >
          Your browser does not support video playback.
        </video>
      ) : (
        <>
          {/* Signed Supabase URLs are short-lived; next/image is not used here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="relative z-10 max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          />
        </>
      )}
    </div>,
    document.body,
  );
}
