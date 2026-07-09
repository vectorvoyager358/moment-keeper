type SaveProgressProps = {
  active: boolean;
  percent: number | null;
  processing: boolean;
  label: string;
};

export function SaveProgress({
  active,
  percent,
  processing,
  label,
}: SaveProgressProps) {
  if (!active) {
    return null;
  }

  const width =
    percent === null ? (processing ? 100 : 0) : Math.min(100, percent);

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="h-2 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full bg-accent transition-[width] duration-150 ${
            processing && percent === 100 ? "animate-pulse" : ""
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-sm text-muted">
        {label}
        {percent !== null && !processing ? ` ${percent}%` : null}
      </p>
    </div>
  );
}
