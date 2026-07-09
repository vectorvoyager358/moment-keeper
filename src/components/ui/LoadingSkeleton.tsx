type LoadingSkeletonProps = {
  lines?: number;
};

export function LoadingSkeleton({ lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 rounded bg-zinc-200 dark:bg-zinc-800"
          style={{ width: `${100 - index * 12}%` }}
        />
      ))}
    </div>
  );
}

export function TimelineSearchSkeleton() {
  return (
    <div
      className="animate-pulse space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      aria-hidden="true"
    >
      <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex gap-2">
        <div className="h-7 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-7 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-7 w-14 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="h-9 w-20 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

export function TimelineFeedSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <ul className="animate-pulse space-y-4" aria-hidden="true">
      {Array.from({ length: cards }).map((_, index) => (
        <li
          key={index}
          className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-3 space-y-2">
            <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PageLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto h-6 max-w-3xl animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="sr-only">{label}</p>
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="animate-pulse space-y-2">
            <div className="h-7 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="mb-8">
          <TimelineSearchSkeleton />
        </div>
        <TimelineFeedSkeleton />
      </main>
    </div>
  );
}
