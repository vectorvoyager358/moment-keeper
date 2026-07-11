import { BookOpen, Camera, LayoutList, Settings } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";

type AppNavProps = {
  current: "timeline" | "capture" | "settings";
};

const navItems = [
  {
    id: "timeline" as const,
    href: "/timeline",
    label: "Timeline",
    icon: LayoutList,
  },
  { id: "capture" as const, href: "/capture", label: "Capture", icon: Camera },
  {
    id: "settings" as const,
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function AppNav({ current }: AppNavProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-paper/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/timeline"
          className="group inline-flex items-center gap-2.5 text-ink transition hover:text-accent"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-subtle text-accent transition group-hover:bg-accent group-hover:text-white">
            <BookOpen className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Moment Keeper
          </span>
        </Link>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border/80 bg-surface/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(42,33,24,0.08)] backdrop-blur-xl sm:static sm:flex sm:items-center sm:gap-1.5 sm:rounded-xl sm:border sm:bg-surface sm:p-1 sm:shadow-none"
          aria-label="Main"
        >
          {navItems.map(({ id, href, label, icon: Icon }) => {
            const active = id === current;

            return (
              <Link
                key={id}
                href={href}
                className={cn(
                  "inline-flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-xs font-medium transition sm:min-h-0 sm:flex-row sm:gap-1.5 sm:rounded-lg sm:py-2 sm:text-sm",
                  active
                    ? "bg-accent-subtle text-accent sm:bg-accent sm:text-white sm:shadow-sm"
                    : "text-muted hover:bg-accent-subtle hover:text-ink",
                  id === "capture" &&
                    !active &&
                    "text-accent hover:text-accent-hover",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
