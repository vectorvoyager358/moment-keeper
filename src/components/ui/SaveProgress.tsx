"use client";

type SaveProgressProps = {
  label?: string;
  percent?: number | null;
  active?: boolean;
  /** When true, show a full bar with pulse (server still working after upload). */
  processing?: boolean;
};

export function SaveProgress({
  label = "Saving your moment…",
  percent = null,
  active = false,
  processing = false,
}: SaveProgressProps) {
  if (!active) {
    return null;
  }

  const hasPercent = typeof percent === "number" && !processing;
  const width = processing ? "100%" : hasPercent ? `${percent}%` : "33%";

  return (
    <div
      className="space-y-2"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full bg-zinc-900 transition-[width] duration-150 dark:bg-zinc-100 ${
            hasPercent && !processing ? "" : "animate-pulse"
          }`}
          style={{ width }}
        />
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {hasPercent ? `${label} ${percent}%` : label}
      </p>
    </div>
  );
}
