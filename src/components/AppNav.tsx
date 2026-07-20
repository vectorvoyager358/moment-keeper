import {
  BookOpen,
  Camera,
  CircleUserRound,
  House,
  Images,
  LayoutList,
  Settings,
} from "lucide-react";
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
    mobileIcon: House,
  },
  {
    id: "capture" as const,
    href: "/capture",
    label: "Capture",
    icon: Camera,
    mobileIcon: Camera,
  },
  {
    id: "browse" as const,
    href: "/browse",
    label: "Look back",
    icon: Images,
    mobileIcon: Images,
  },
  {
    id: "settings" as const,
    href: "/settings",
    label: "Account",
    icon: Settings,
    mobileIcon: CircleUserRound,
  },
];

type NavItem = (typeof navItems)[number];

const mobileNavItems: NavItem[] = [
  navItems[0],
  navItems[2],
  navItems[1],
  navItems[3],
];

function NavLink({
  item,
  active,
  mobile,
}: {
  item: NavItem;
  active: boolean;
  mobile: boolean;
}) {
  const Icon = mobile ? item.mobileIcon : item.icon;

  return (
    <Link
      href={item.href}
      aria-label={mobile ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        mobile
          ? "flex min-h-11 min-w-11 items-center justify-center rounded-[1.55rem] transition duration-200 touch-manipulation"
          : "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
        active
          ? mobile
            ? "bg-accent-subtle text-accent shadow-[inset_0_0_0_1px_rgba(184,121,46,0.08)]"
            : "bg-accent text-white shadow-sm"
          : mobile
            ? "text-muted hover:bg-accent-subtle/70 hover:text-ink active:scale-95"
            : "text-muted hover:bg-accent-subtle hover:text-ink",
        item.id === "capture" &&
          !active &&
          "text-accent hover:text-accent-hover",
      )}
    >
      <Icon
        className={cn(mobile ? "h-6 w-6" : "h-4 w-4", "shrink-0")}
        strokeWidth={active && mobile ? 2.4 : 2}
        aria-hidden
      />
      {mobile ? null : <span className="whitespace-nowrap">{item.label}</span>}
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
        className="fixed inset-x-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mx-auto grid h-16 max-w-sm grid-cols-4 gap-1 rounded-[2rem] border border-border/90 bg-surface/90 p-1.5 shadow-[0_10px_32px_rgba(42,33,24,0.14)] backdrop-blur-xl md:hidden"
        aria-label="Main"
      >
        {mobileNavItems.map((item) => (
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
