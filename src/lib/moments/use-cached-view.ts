"use client";

import { useEffect, useRef } from "react";

import {
  setViewScroll,
  VIEW_CACHE_HIDDEN_REFRESH_MS,
} from "@/lib/moments/view-cache";

export function useRestoreViewScroll(scrollY: number): void {
  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current) {
      return;
    }

    restoredRef.current = true;
    window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
  }, [scrollY]);
}

export function usePersistViewScroll(cacheKey: string, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    function persist() {
      setViewScroll(cacheKey, window.scrollY);
    }

    window.addEventListener("scroll", persist, { passive: true });
    return () => {
      persist();
      window.removeEventListener("scroll", persist);
    };
  }, [cacheKey, enabled]);
}

export function useVisibilityRefresh(refresh: () => void): void {
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    let hiddenAt = 0;

    function handleVisibility() {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }

      if (
        hiddenAt > 0 &&
        Date.now() - hiddenAt >= VIEW_CACHE_HIDDEN_REFRESH_MS
      ) {
        refreshRef.current();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);
}
