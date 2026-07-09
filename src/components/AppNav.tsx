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
    <header className="sticky top-0 z-10 border-b border-border bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
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
          className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1 sm:gap-1.5"
          aria-label="Main"
        >
          {navItems.map(({ id, href, label, icon: Icon }) => {
            const active = id === current;

            return (
              <Link
                key={id}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-accent text-white shadow-sm"
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
