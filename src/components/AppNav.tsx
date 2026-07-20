"use client";

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
import { useRouter } from "next/navigation";
import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/cn";

type AppNavProps = {
  current: "timeline" | "capture" | "browse" | "settings";
};

const MOBILE_NAV_COMPACT_SCROLL_Y = 48;

export function getMobileNavPosition(
  clientX: number,
  navLeft: number,
  navWidth: number,
  itemCount: number,
): number {
  if (navWidth <= 0 || itemCount <= 1) {
    return 0;
  }

  const rawPosition = ((clientX - navLeft) / navWidth) * itemCount - 0.5;
  return Math.min(itemCount - 1, Math.max(0, rawPosition));
}

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
  compact = false,
}: {
  item: NavItem;
  active: boolean;
  mobile: boolean;
  compact?: boolean;
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
            ? "text-accent"
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
        className={cn(
          mobile
            ? compact
              ? "h-[1.375rem] w-[1.375rem]"
              : "h-6 w-6"
            : "h-4 w-4",
          "shrink-0 transition-[width,height] duration-300 motion-reduce:transition-none",
        )}
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
  const router = useRouter();
  const [mobileNavCompact, setMobileNavCompact] = useState(false);
  const activeMobileIndex = mobileNavItems.findIndex(
    (item) => item.id === current,
  );
  const [indicatorPosition, setIndicatorPosition] = useState(
    activeMobileIndex < 0 ? 0 : activeMobileIndex,
  );
  const [dragging, setDragging] = useState(false);
  const dragPointerId = useRef<number | null>(null);
  const dragStartX = useRef(0);
  const didDrag = useRef(false);

  useEffect(() => {
    function handleScroll() {
      setMobileNavCompact(window.scrollY > MOBILE_NAV_COMPACT_SCROLL_Y);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (dragPointerId.current === null) {
      setIndicatorPosition(activeMobileIndex < 0 ? 0 : activeMobileIndex);
    }
  }, [activeMobileIndex]);

  function positionForPointer(event: ReactPointerEvent<HTMLElement>): number {
    const bounds = event.currentTarget.getBoundingClientRect();
    return getMobileNavPosition(
      event.clientX,
      bounds.left,
      bounds.width,
      mobileNavItems.length,
    );
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }

    dragPointerId.current = event.pointerId;
    dragStartX.current = event.clientX;
    didDrag.current = false;
    setDragging(true);
    setIndicatorPosition(positionForPointer(event));
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (dragPointerId.current !== event.pointerId) {
      return;
    }

    if (Math.abs(event.clientX - dragStartX.current) > 6) {
      didDrag.current = true;
    }

    setIndicatorPosition(positionForPointer(event));
  }

  function finishPointerGesture(event: ReactPointerEvent<HTMLElement>) {
    if (dragPointerId.current !== event.pointerId) {
      return;
    }

    const targetIndex = Math.round(positionForPointer(event));
    const target = mobileNavItems[targetIndex];
    dragPointerId.current = null;
    setDragging(false);
    setIndicatorPosition(targetIndex);
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (didDrag.current && target && target.id !== current) {
      router.push(target.href);
    }
  }

  function cancelPointerGesture(event: ReactPointerEvent<HTMLElement>) {
    if (dragPointerId.current !== event.pointerId) {
      return;
    }

    dragPointerId.current = null;
    didDrag.current = false;
    setDragging(false);
    setIndicatorPosition(activeMobileIndex < 0 ? 0 : activeMobileIndex);
  }

  function suppressLinkClickAfterDrag(event: ReactMouseEvent<HTMLElement>) {
    if (!didDrag.current) {
      return;
    }

    event.preventDefault();
    didDrag.current = false;
  }

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
        className={cn(
          "fixed inset-x-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mx-auto grid touch-pan-y grid-cols-4 overflow-hidden border border-border/65 bg-surface/40 p-1 shadow-[0_10px_32px_rgba(42,33,24,0.14)] transition-[height,max-width,border-radius,background-color] duration-300 ease-out select-none motion-reduce:transition-none md:hidden",
          mobileNavCompact
            ? "h-14 max-w-xs rounded-[1.75rem]"
            : "h-16 max-w-sm rounded-[2rem]",
        )}
        aria-label="Main"
        data-compact={mobileNavCompact ? "true" : "false"}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerGesture}
        onPointerCancel={cancelPointerGesture}
        onClickCapture={suppressLinkClickAfterDrag}
      >
        <span
          aria-hidden
          data-testid="mobile-nav-lens"
          className={cn(
            "pointer-events-none absolute inset-y-1 left-1 w-[calc((100%_-_0.5rem)/4)] rounded-[1.5rem] border border-surface-elevated/80 bg-surface/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),inset_0_-1px_1px_rgba(184,121,46,0.12),0_3px_12px_rgba(42,33,24,0.1)] motion-reduce:transition-none",
            dragging
              ? "scale-[1.04] transition-transform duration-75"
              : "transition-transform duration-300 ease-out",
          )}
          style={{
            transform: `translateX(${indicatorPosition * 100}%)${
              dragging ? " scale(1.04)" : ""
            }`,
          }}
        />
        {mobileNavItems.map((item) => (
          <span className="relative z-10 grid" key={item.id}>
            <NavLink
              item={item}
              active={item.id === current}
              mobile
              compact={mobileNavCompact}
            />
          </span>
        ))}
      </nav>
    </>
  );
}
