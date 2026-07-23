"use client";

import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

type VideoThumbnailProps = {
  src: string;
  className?: string;
  fill?: boolean;
};

export function VideoThumbnail({
  src,
  className,
  fill = false,
}: VideoThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [frameReady, setFrameReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    let active = true;

    const reveal = () => {
      if (active) {
        setShouldLoad(true);
      }
    };

    if (!container || typeof IntersectionObserver === "undefined") {
      queueMicrotask(reveal);
      return () => {
        active = false;
      };
    }

    let observer: IntersectionObserver;

    try {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            reveal();
            observer.disconnect();
          }
        },
        { rootMargin: "240px" },
      );
      observer.observe(container);
    } catch {
      queueMicrotask(reveal);
    }

    return () => {
      active = false;
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Video thumbnail"
      className={cn(
        "overflow-hidden bg-gradient-to-br from-accent-subtle to-tag",
        fill ? "absolute inset-0 h-full w-full" : "relative",
        className,
      )}
    >
      {shouldLoad ? (
        <video
          src={`${src}#t=0.1`}
          muted
          playsInline
          preload="metadata"
          aria-hidden
          tabIndex={-1}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            frameReady ? "opacity-100" : "opacity-0",
          )}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            if (video.duration > 0.1) {
              video.currentTime = 0.1;
            }
          }}
          onLoadedData={() => setFrameReady(true)}
          onSeeked={() => setFrameReady(true)}
        />
      ) : null}

      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white shadow-sm backdrop-blur-[2px]">
          <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden />
        </span>
      </span>
    </div>
  );
}
