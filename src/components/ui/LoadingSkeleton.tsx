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
      className="animate-pulse space-y-4 rounded-3xl bg-surface p-4 shadow-card ring-1 ring-border/55"
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
    <ul
      className="grid animate-pulse grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2"
      aria-hidden="true"
    >
      {Array.from({ length: cards }).map((_, index) => (
        <li
          key={index}
          className="overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-border/50"
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
    <div className="min-h-full bg-paper pt-[env(safe-area-inset-top)] pb-[calc(6.75rem+env(safe-area-inset-bottom))] md:pt-[4.75rem] md:pb-0">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <p className="sr-only">{label}</p>
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="animate-pulse space-y-2">
            <div className="h-9 w-44 rounded-xl bg-border" />
            <div className="h-4 w-64 max-w-full rounded bg-border" />
          </div>
          <div className="h-11 w-11 animate-pulse rounded-full bg-border" />
        </div>
        <div className="animate-pulse rounded-3xl bg-surface p-5 shadow-card ring-1 ring-border/55 sm:p-7">
          <div className="mb-6 h-48 rounded-2xl bg-border/75 sm:h-56" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-border" />
            <div className="h-4 w-5/6 rounded bg-border" />
            <div className="h-4 w-2/3 rounded bg-border" />
          </div>
        </div>
      </main>
    </div>
  );
}
