import Link from "next/link";

type AppNavProps = {
  current: "timeline" | "settings";
};

export function AppNav({ current }: AppNavProps) {
  const linkClass = (page: AppNavProps["current"]) =>
    page === current
      ? "font-medium text-zinc-900 dark:text-zinc-50"
      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100";

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/timeline" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Moment Keeper
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/timeline" className={linkClass("timeline")}>
            Timeline
          </Link>
          <Link href="/settings" className={linkClass("settings")}>
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
