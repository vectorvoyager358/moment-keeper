"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

const SCROLL_THRESHOLD_PX = 360;

type ScrollToTopButtonProps = {
  className?: string;
};

export function ScrollToTopButton({ className }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > SCROLL_THRESHOLD_PX);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      aria-label="Back to top"
      title="Back to top"
      onClick={scrollToTop}
      className={cn(
        "fixed right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-accent shadow-card ring-1 ring-border-strong/80 transition duration-[var(--duration-normal)] hover:bg-accent-subtle hover:ring-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 touch-manipulation",
        "bottom-[calc(6.25rem+env(safe-area-inset-bottom))] md:bottom-8",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0",
        className,
      )}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
