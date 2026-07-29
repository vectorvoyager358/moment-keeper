import * as Sentry from "@sentry/nextjs";

type MediaTimingSource = "primary" | "fallback";

export function recordMediaPreviewTiming(
  resourceUrl: string,
  source: MediaTimingSource,
  priority: boolean,
): void {
  if (typeof PerformanceResourceTiming === "undefined") {
    return;
  }

  const entries = performance.getEntriesByName(resourceUrl, "resource");
  const entry = entries.at(-1);

  if (!(entry instanceof PerformanceResourceTiming) || entry.duration <= 0) {
    return;
  }

  const durationMs = Math.round(entry.duration * 10) / 10;
  const attributes = {
    source,
    priority: priority ? "high" : "normal",
    durationMs,
  };

  const startedAt = performance.timeOrigin + entry.startTime;
  const span = Sentry.startInactiveSpan({
    name: "media.preview_load",
    op: "resource.img",
    onlyIfParent: true,
    startTime: startedAt,
    attributes,
  });
  span.end(startedAt + entry.duration);

  if (process.env.NEXT_PUBLIC_PERFORMANCE_LOGGING === "true") {
    console.info("[performance]", {
      name: "media.preview_load",
      ...attributes,
    });
  }
}
