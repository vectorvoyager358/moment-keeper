import { CalendarDays, Images } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";

type BrowseView = "calendar" | "media";

export function BrowseTabs({ active }: { active: BrowseView }) {
  const tabs = [
    {
      id: "media" as const,
      href: "/browse?view=media",
      label: "Media",
      icon: Images,
    },
    {
      id: "calendar" as const,
      href: "/browse?view=calendar",
      label: "By date",
      icon: CalendarDays,
    },
  ];

  return (
    <nav
      aria-label="Browse views"
      className="mb-6 grid w-full grid-cols-2 rounded-2xl bg-surface p-1 shadow-card ring-1 ring-border/60 sm:mb-8 sm:max-w-md"
    >
      {tabs.map(({ id, href, label, icon: Icon }) => (
        <Link
          key={id}
          href={href}
          aria-current={active === id ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:px-4",
            active === id
              ? "bg-accent text-white shadow-sm"
              : "text-muted hover:bg-accent-subtle hover:text-ink",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
