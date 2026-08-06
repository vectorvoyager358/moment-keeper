"use client";

import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

type VideoThumbnailProps = {
  src?: string | null;
  posterSrc?: string | null;
  className?: string;
  fill?: boolean;
};

export function VideoThumbnail({
  src,
  posterSrc,
  className,
  fill = false,
}: VideoThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [failedPosterSrc, setFailedPosterSrc] = useState<string | null>(null);
  const posterFailed = Boolean(
    posterSrc && failedPosterSrc && posterSrc === failedPosterSrc,
  );

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
      {posterSrc && !posterFailed ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed media URL
        <img
          src={posterSrc}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailedPosterSrc(posterSrc)}
        />
      ) : null}

      {shouldLoad && src && (!posterSrc || posterFailed) ? (
        <video
          src={src}
          muted
          playsInline
          preload="auto"
          aria-hidden
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;

            if (Number.isFinite(video.duration) && video.duration > 0) {
              try {
                video.currentTime = Math.min(0.1, video.duration / 2);
              } catch {
                // Some mobile browsers expose a frame before allowing a seek.
              }
            }
          }}
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
