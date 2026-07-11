import { CalendarDays, Images } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";

type BrowseView = "calendar" | "media";

export function BrowseTabs({ active }: { active: BrowseView }) {
  const tabs = [
    {
      id: "calendar" as const,
      href: "/browse?view=calendar",
      label: "By date",
      icon: CalendarDays,
    },
    {
      id: "media" as const,
      href: "/browse?view=media",
      label: "Media",
      icon: Images,
    },
  ];

  return (
    <nav
      aria-label="Browse views"
      className="mb-8 inline-flex rounded-2xl border border-border bg-surface p-1 shadow-card"
    >
      {tabs.map(({ id, href, label, icon: Icon }) => (
        <Link
          key={id}
          href={href}
          aria-current={active === id ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
            active === id
              ? "bg-accent text-white shadow-sm"
              : "text-muted hover:bg-accent-subtle hover:text-ink",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
