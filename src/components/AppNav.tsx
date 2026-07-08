import Link from "next/link";

type AppNavProps = {
  current: "timeline" | "capture" | "settings";
};

export function AppNav({ current }: AppNavProps) {
  const linkClass = (page: AppNavProps["current"]) => {
    const active = page === current;

    return [
      "rounded-lg px-3 py-2 text-sm transition",
      active
        ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100",
    ].join(" ");
  };

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <Link
          href="/timeline"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Moment Keeper
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          <Link href="/timeline" className={linkClass("timeline")}>
            Timeline
          </Link>
          <Link href="/capture" className={linkClass("capture")}>
            Capture
          </Link>
          <Link href="/settings" className={linkClass("settings")}>
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
