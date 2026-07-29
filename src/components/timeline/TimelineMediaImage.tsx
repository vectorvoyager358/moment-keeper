"use client";

import { useRef, useState } from "react";

import { recordMediaPreviewTiming } from "@/lib/performance/media-timing";

type TimelineMediaImageProps = {
  src: string;
  fallbackSrc?: string | null;
  fallbackRequestUrl?: string | null;
  alt?: string;
  className?: string;
  onUnavailable?: () => void;
  priority?: boolean;
};

export function TimelineMediaImage({
  src,
  fallbackSrc = null,
  fallbackRequestUrl = null,
  alt = "",
  className,
  onUnavailable,
  priority = false,
}: TimelineMediaImageProps) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const [requestedFallbackSrc, setRequestedFallbackSrc] = useState<
    string | null
  >(null);
  const fallbackRequestedRef = useRef(false);
  const resolvedFallbackSrc =
    fallbackSrc && !failedSources.includes(fallbackSrc)
      ? fallbackSrc
      : requestedFallbackSrc;
  const currentSrc = !failedSources.includes(src)
    ? src
    : resolvedFallbackSrc && !failedSources.includes(resolvedFallbackSrc)
      ? resolvedFallbackSrc
      : null;

  if (!currentSrc) {
    return null;
  }

  return (
    // Signed Supabase URLs are short-lived; next/image is not used here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={currentSrc}
      src={currentSrc}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={false}
      className={className}
      onLoad={() => {
        recordMediaPreviewTiming(
          currentSrc,
          currentSrc === src ? "primary" : "fallback",
          priority,
        );
      }}
      onError={async () => {
        const hasNextSource = Boolean(
          resolvedFallbackSrc &&
            resolvedFallbackSrc !== currentSrc &&
            !failedSources.includes(resolvedFallbackSrc),
        );

        setFailedSources((failed) =>
          failed.includes(currentSrc) ? failed : [...failed, currentSrc],
        );

        if (hasNextSource) {
          return;
        }

        if (fallbackRequestUrl && !fallbackRequestedRef.current) {
          fallbackRequestedRef.current = true;

          try {
            const response = await fetch(fallbackRequestUrl, {
              credentials: "same-origin",
              cache: "no-store",
            });

            if (response.ok) {
              const payload = (await response.json()) as { url?: unknown };

              if (typeof payload.url === "string" && payload.url) {
                setRequestedFallbackSrc(payload.url);
                return;
              }
            }
          } catch {
            // The media frame remains usable when the private fallback fails.
          }
        }

        onUnavailable?.();
      }}
    />
  );
}
