import Link from "next/link";

import { AppNav } from "@/components/AppNav";

export default function MomentNotFound() {
  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <AppNav current="timeline" />
      <main className="mx-auto max-w-2xl px-6 py-10 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Moment not found
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This moment may have been deleted or you do not have access to it.
        </p>
        <Link
          href="/timeline"
          className="mt-6 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Back to timeline
        </Link>
      </main>
    </div>
  );
}
