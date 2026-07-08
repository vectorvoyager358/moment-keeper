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

export function PageLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto h-6 max-w-3xl animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="sr-only">{label}</p>
        <LoadingSkeleton lines={4} />
      </main>
    </div>
  );
}
