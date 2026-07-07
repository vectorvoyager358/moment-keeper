import { AppNav } from "@/components/AppNav";

export default function TimelinePage() {
  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <AppNav current="timeline" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Timeline</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Your moments will appear here. Capture is coming next.
        </p>
      </main>
    </div>
  );
}
