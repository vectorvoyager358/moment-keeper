type LoadingSkeletonProps = {
  lines?: number;
};

export function LoadingSkeleton({ lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-4 w-1/3 rounded bg-border" />
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 rounded bg-border"
          style={{ width: `${100 - index * 12}%` }}
        />
      ))}
    </div>
  );
}

export function TimelineSearchSkeleton() {
  return (
    <div
      className="animate-pulse space-y-4 rounded-2xl border border-border bg-surface p-4"
      aria-hidden="true"
    >
      <div className="h-4 w-16 rounded bg-border" />
      <div className="h-10 rounded-lg bg-border" />
      <div className="flex gap-2">
        <div className="h-7 w-16 rounded-full bg-border" />
        <div className="h-7 w-20 rounded-full bg-border" />
        <div className="h-7 w-14 rounded-full bg-border" />
      </div>
      <div className="h-9 w-20 rounded-lg bg-border" />
    </div>
  );
}

export function TimelineFeedSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <ul className="animate-pulse space-y-4" aria-hidden="true">
      {Array.from({ length: cards }).map((_, index) => (
        <li
          key={index}
          className="overflow-hidden rounded-2xl border border-border bg-surface"
        >
          {index % 2 === 0 ? (
            <div className="aspect-[16/9] w-full bg-border" />
          ) : null}
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="h-4 w-28 rounded bg-border" />
              <div className="h-5 w-14 rounded-full bg-border" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-border" />
              <div className="h-4 w-5/6 rounded bg-border" />
              <div className="h-4 w-2/3 rounded bg-border" />
            </div>
            <div className="flex gap-2 pt-1">
              <div className="h-6 w-14 rounded-full bg-border" />
              <div className="h-6 w-16 rounded-full bg-border" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PageLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="min-h-full bg-paper">
      <div className="border-b border-border bg-surface px-4 py-4">
        <div className="mx-auto h-6 max-w-3xl animate-pulse rounded bg-border" />
      </div>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="sr-only">{label}</p>
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="animate-pulse space-y-2">
            <div className="h-7 w-32 rounded bg-border" />
            <div className="h-4 w-48 rounded bg-border" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-lg bg-border" />
        </div>
        <div className="mb-8">
          <TimelineSearchSkeleton />
        </div>
        <TimelineFeedSkeleton />
      </main>
    </div>
  );
}
