"use client";

import { LoaderCircle } from "lucide-react";
import {
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";

import { cn } from "@/lib/cn";

const PULL_THRESHOLD = 64;
const MAX_PULL = 96;

type PullToRefreshProps = {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  children: ReactNode;
};

export function getPullDistance(
  startY: number,
  currentY: number,
  scrollY: number,
): number {
  if (scrollY > 0) {
    return 0;
  }

  const raw = currentY - startY;
  if (raw <= 0) {
    return 0;
  }

  return Math.min(MAX_PULL, raw * 0.45);
}

export function shouldTriggerRefresh(pullDistance: number): boolean {
  return pullDistance >= PULL_THRESHOLD;
}

export function PullToRefresh({
  onRefresh,
  disabled = false,
  children,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const pullRef = useRef(0);

  function resetPull() {
    startYRef.current = null;
    pullRef.current = 0;
    setPullDistance(0);
  }

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (disabled || refreshing || window.scrollY > 0) {
      return;
    }

    startYRef.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    if (startYRef.current === null || disabled || refreshing) {
      return;
    }

    const currentY = event.touches[0]?.clientY ?? startYRef.current;
    const nextPull = getPullDistance(
      startYRef.current,
      currentY,
      window.scrollY,
    );
    pullRef.current = nextPull;
    setPullDistance(nextPull);
  }

  async function handleTouchEnd() {
    if (startYRef.current === null) {
      return;
    }

    const shouldRefresh = !disabled && shouldTriggerRefresh(pullRef.current);
    resetPull();

    if (!shouldRefresh) {
      return;
    }

    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  const indicatorVisible = refreshing || pullDistance > 8;

  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => {
        void handleTouchEnd();
      }}
      onTouchCancel={resetPull}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-10 flex h-12 items-center justify-center text-accent transition-opacity",
          indicatorVisible ? "opacity-100" : "opacity-0",
        )}
        style={{
          transform: `translateY(${refreshing ? 8 : Math.max(0, pullDistance - 24)}px)`,
        }}
        aria-hidden={!refreshing}
      >
        <LoaderCircle
          className={cn(
            "h-5 w-5",
            refreshing || pullDistance >= PULL_THRESHOLD
              ? "animate-spin"
              : "opacity-70",
          )}
          aria-hidden
        />
        <span className="sr-only">
          {refreshing ? "Refreshing your memories" : "Pull to refresh"}
        </span>
      </div>
      {children}
    </div>
  );
}
