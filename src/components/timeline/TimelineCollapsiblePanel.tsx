"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

const STORAGE_PREFIX = "moment-keeper:timeline-panel:";

function readPanelOpen(storageKey: string): boolean {
  try {
    return sessionStorage.getItem(storageKey) === "open";
  } catch {
    return false;
  }
}

function writePanelOpen(storageKey: string, open: boolean): void {
  try {
    sessionStorage.setItem(storageKey, open ? "open" : "closed");
  } catch {
    // Session storage can be unavailable in restricted browser modes.
  }
}

type TimelineCollapsiblePanelProps = {
  panelId: string;
  title: string;
  description?: string;
  initialOpen?: boolean;
  className?: string;
  children: ReactNode;
};

export function TimelineCollapsiblePanel({
  panelId,
  title,
  description,
  initialOpen = false,
  className,
  children,
}: TimelineCollapsiblePanelProps) {
  const storageKey = `${STORAGE_PREFIX}${panelId}`;
  const [expanded, setExpanded] = useState(() => readPanelOpen(storageKey));
  const [userCollapsed, setUserCollapsed] = useState(false);
  const isOpen = initialOpen ? !userCollapsed : expanded;

  function toggle() {
    if (initialOpen) {
      setUserCollapsed((collapsed) => !collapsed);
      return;
    }

    setExpanded((current) => {
      const next = !current;
      writePanelOpen(storageKey, next);
      return next;
    });
  }

  return (
    <section
      className={cn("mb-8", className)}
      aria-labelledby={`${panelId}-heading`}
    >
      <button
        type="button"
        id={`${panelId}-heading`}
        aria-expanded={isOpen}
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-2xl border border-border-strong bg-surface px-4 py-3 text-left transition hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <span>
          <span className="block font-display text-base font-semibold text-ink">
            {title}
          </span>
          {description ? (
            <span className="mt-0.5 block text-sm text-muted">
              {description}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition",
            isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {isOpen ? <div className="mt-4 space-y-8">{children}</div> : null}
    </section>
  );
}
