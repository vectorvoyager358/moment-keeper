import { BookOpen, Camera, Images, LayoutList, Settings } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";

type AppNavProps = {
  current: "timeline" | "capture" | "browse" | "settings";
};

const navItems = [
  {
    id: "timeline" as const,
    href: "/timeline",
    label: "Journal",
    icon: LayoutList,
  },
  { id: "capture" as const, href: "/capture", label: "Capture", icon: Camera },
  { id: "browse" as const, href: "/browse", label: "Look back", icon: Images },
  {
    id: "settings" as const,
    href: "/settings",
    label: "Account",
    icon: Settings,
  },
];

type NavItem = (typeof navItems)[number];

function NavLink({
  item,
  active,
  mobile,
}: {
  item: NavItem;
  active: boolean;
  mobile: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        mobile
          ? "flex w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[0.625rem] font-medium leading-tight transition"
          : "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
        active
          ? mobile
            ? "bg-accent-subtle text-accent"
            : "bg-accent text-white shadow-sm"
          : mobile
            ? "text-muted hover:bg-accent-subtle hover:text-ink"
            : "text-muted hover:bg-accent-subtle hover:text-ink",
        item.id === "capture" &&
          !active &&
          "text-accent hover:text-accent-hover",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      <span
        className={cn(
          mobile
            ? "line-clamp-2 w-full max-w-[4.5rem] text-center"
            : "whitespace-nowrap",
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

function BrandMark() {
  return (
    <Link
      href="/timeline"
      className="group inline-flex items-center gap-2 text-ink transition hover:text-accent"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-subtle text-accent transition group-hover:bg-accent group-hover:text-white md:h-9 md:w-9 md:rounded-xl">
        <BookOpen
          className="h-3.5 w-3.5 md:h-4 md:w-4"
          strokeWidth={2.25}
          aria-hidden
        />
      </span>
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className="font-display text-[0.9375rem] font-semibold tracking-tight md:text-lg">
          Moment
        </span>
        <span className="font-display text-[0.9375rem] font-semibold tracking-tight text-accent md:text-lg">
          Keeper
        </span>
      </span>
    </Link>
  );
}

export function AppNav({ current }: AppNavProps) {
  return (
    <>
      <header className="sticky top-0 z-20 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-4xl items-center justify-between border-b border-border/80 px-4 md:h-auto md:px-6 md:py-3.5">
          <BrandMark />

          <nav
            className="hidden items-center gap-1.5 rounded-xl border border-border bg-surface p-1 md:flex"
            aria-label="Main"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                active={item.id === current}
                mobile={false}
              />
            ))}
          </nav>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border/80 bg-surface/95 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(42,33,24,0.08)] backdrop-blur-xl md:hidden"
        aria-label="Main"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            item={item}
            active={item.id === current}
            mobile
          />
        ))}
      </nav>
    </>
  );
}
