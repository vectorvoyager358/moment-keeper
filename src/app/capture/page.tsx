import Link from "next/link";

import { CaptureForm } from "@/components/capture/CaptureForm";
import { AppNav } from "@/components/AppNav";

export default function CapturePage() {
  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <AppNav current="capture" />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Capture a moment
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            A few words is enough. You can always edit later.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <CaptureForm />
        </section>

        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/timeline" className="underline-offset-4 hover:underline">
            Back to timeline
          </Link>
        </p>
      </main>
    </div>
  );
}
