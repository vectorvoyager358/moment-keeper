"use client";

import { useState } from "react";

type TimelineMediaImageProps = {
  src: string;
  fallbackSrc?: string | null;
  alt?: string;
  className?: string;
};

export function TimelineMediaImage({
  src,
  fallbackSrc = null,
  alt = "",
  className,
}: TimelineMediaImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failedFallback, setFailedFallback] = useState(false);

  return (
    // Signed Supabase URLs are short-lived; next/image is not used here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={className}
      onError={() => {
        if (fallbackSrc && !failedFallback && currentSrc !== fallbackSrc) {
          setFailedFallback(true);
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
