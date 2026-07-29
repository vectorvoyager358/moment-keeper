"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { MediaDownloadButton } from "@/components/moments/MediaDownloadButton";
import { TimelineMediaImage } from "@/components/timeline/TimelineMediaImage";

export type MediaPreviewItem = {
  id: string;
  src: string;
  alt: string;
  filename: string;
  mediaType: "photo" | "video";
  fallbackRequestUrl?: string;
};

type MediaPreviewOverlayProps = {
  src?: string;
  alt?: string;
  filename?: string;
  mediaType?: "photo" | "video";
  fallbackRequestUrl?: string;
  items?: MediaPreviewItem[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
};

function subscribeToMounted() {
  return () => {};
}

function clampIndex(index: number, itemCount: number) {
  return Math.min(Math.max(index, 0), Math.max(itemCount - 1, 0));
}

export function MediaPreviewOverlay({
  src,
  alt,
  filename,
  mediaType = "photo",
  fallbackRequestUrl,
  items,
  initialIndex = 0,
  open,
  onClose,
}: MediaPreviewOverlayProps) {
  const mounted = useSyncExternalStore(
    subscribeToMounted,
    () => true,
    () => false,
  );
  const fallbackItem =
    src && alt && filename
      ? [
          {
            id: src,
            src,
            alt,
            filename,
            mediaType,
            fallbackRequestUrl,
          },
        ]
      : [];
  const previewItems = items?.length ? items : fallbackItem;
  const itemKey = previewItems
    .map((item) => `${item.id}:${item.src}`)
    .join("|");
  const [activeIndex, setActiveIndex] = useState(() =>
    clampIndex(initialIndex, previewItems.length),
  );
  const scrollerRef = useRef<HTMLDivElement>(null);

  const goToIndex = useCallback(
    (nextIndex: number, behavior: ScrollBehavior = "smooth") => {
      const index = clampIndex(nextIndex, previewItems.length);
      const scroller = scrollerRef.current;

      setActiveIndex(index);
      if (scroller) {
        scroller.scrollTo({
          left: scroller.clientWidth * index,
          behavior,
        });
      }
    },
    [previewItems.length],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const index = clampIndex(initialIndex, previewItems.length);
    const frame = window.requestAnimationFrame(() => {
      setActiveIndex(index);
      const scroller = scrollerRef.current;
      if (scroller) {
        scroller.scrollLeft = scroller.clientWidth * index;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [initialIndex, itemKey, open, previewItems.length]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToIndex(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToIndex(activeIndex + 1);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, goToIndex, onClose, open]);

  if (!open || !mounted || previewItems.length === 0) {
    return null;
  }

  const activeItem = previewItems[activeIndex] ?? previewItems[0];
  const mediaLabel = activeItem.mediaType === "video" ? "video" : "photo";
  const hasMultipleItems = previewItems.length > 1;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Media preview"
      className="fixed inset-0 z-[70] bg-black/92"
    >
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 left-4 z-30 flex items-center justify-between gap-3">
        {hasMultipleItems ? (
          <span
            className="rounded-full bg-black/45 px-3 py-2 text-sm font-semibold text-white backdrop-blur-md"
            aria-live="polite"
          >
            {activeIndex + 1} / {previewItems.length}
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <MediaDownloadButton
            src={activeItem.src}
            filename={activeItem.filename}
            appearance="overlay"
          />
          <button
            type="button"
            className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label={`Close ${mediaLabel} preview`}
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        data-testid="media-preview-carousel"
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(event) => {
          const scroller = event.currentTarget;
          if (scroller.clientWidth === 0) {
            return;
          }

          const nextIndex = clampIndex(
            Math.round(scroller.scrollLeft / scroller.clientWidth),
            previewItems.length,
          );
          setActiveIndex((currentIndex) =>
            currentIndex === nextIndex ? currentIndex : nextIndex,
          );
        }}
      >
        {previewItems.map((item, index) => (
          <div
            key={item.id}
            className="flex h-full w-full shrink-0 snap-center snap-always items-center justify-center px-4 pt-[max(4.75rem,calc(env(safe-area-inset-top)+4rem))] pb-[max(1rem,env(safe-area-inset-bottom))]"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                onClose();
              }
            }}
          >
            {item.mediaType === "video" ? (
              <video
                controls
                src={item.src}
                playsInline
                preload={index === activeIndex ? "metadata" : "none"}
                aria-label={item.alt}
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <TimelineMediaImage
                src={item.src}
                fallbackRequestUrl={item.fallbackRequestUrl}
                alt={item.alt}
                priority={index === activeIndex}
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              />
            )}
          </div>
        ))}
      </div>

      {hasMultipleItems ? (
        <>
          <button
            type="button"
            aria-label="Previous attachment"
            disabled={activeIndex === 0}
            onClick={() => goToIndex(activeIndex - 1)}
            className="absolute top-1/2 left-3 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65 disabled:pointer-events-none disabled:opacity-25 sm:flex"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next attachment"
            disabled={activeIndex === previewItems.length - 1}
            onClick={() => goToIndex(activeIndex + 1)}
            className="absolute top-1/2 right-3 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65 disabled:pointer-events-none disabled:opacity-25 sm:flex"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        </>
      ) : null}
    </div>,
    document.body,
  );
}
