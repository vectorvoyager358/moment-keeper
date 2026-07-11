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
        "fixed right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border-strong bg-surface text-accent shadow-card transition duration-[var(--duration-normal)] hover:border-accent/50 hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 touch-manipulation",
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-8",
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
