"use client";

import { useState } from "react";

type TimelineMediaImageProps = {
  src: string;
  fallbackSrc?: string | null;
  alt?: string;
  className?: string;
  onUnavailable?: () => void;
  priority?: boolean;
};

export function TimelineMediaImage({
  src,
  fallbackSrc = null,
  alt = "",
  className,
  onUnavailable,
  priority = false,
}: TimelineMediaImageProps) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const currentSrc = !failedSources.includes(src)
    ? src
    : fallbackSrc && !failedSources.includes(fallbackSrc)
      ? fallbackSrc
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
      onError={() => {
        const hasNextSource = Boolean(
          fallbackSrc &&
            fallbackSrc !== currentSrc &&
            !failedSources.includes(fallbackSrc),
        );

        setFailedSources((failed) =>
          failed.includes(currentSrc) ? failed : [...failed, currentSrc],
        );

        if (!hasNextSource) {
          onUnavailable?.();
        }
      }}
    />
  );
}
