"use client";

import { ChevronDown } from "lucide-react";
import { useState, useSyncExternalStore, type ReactNode } from "react";

import { cn } from "@/lib/cn";

const STORAGE_PREFIX = "moment-keeper:timeline-panel:";
const storageListeners = new Map<string, Set<() => void>>();

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

function subscribePanel(storageKey: string, onStoreChange: () => void) {
  let listeners = storageListeners.get(storageKey);

  if (!listeners) {
    listeners = new Set();
    storageListeners.set(storageKey, listeners);
  }

  listeners.add(onStoreChange);

  return () => {
    listeners?.delete(onStoreChange);
  };
}

function notifyPanel(storageKey: string) {
  storageListeners.get(storageKey)?.forEach((listener) => {
    listener();
  });
}

type TimelineCollapsiblePanelProps = {
  panelId: string;
  title: string;
  description?: string;
  initialOpen?: boolean;
  className?: string;
  combinedWhenOpen?: boolean;
  children: ReactNode;
};

export function TimelineCollapsiblePanel({
  panelId,
  title,
  description,
  initialOpen = false,
  className,
  combinedWhenOpen = false,
  children,
}: TimelineCollapsiblePanelProps) {
  const storageKey = `${STORAGE_PREFIX}${panelId}`;
  const storedExpanded = useSyncExternalStore(
    (onStoreChange) => subscribePanel(storageKey, onStoreChange),
    () => readPanelOpen(storageKey),
    () => false,
  );
  const [userCollapsed, setUserCollapsed] = useState(false);
  const isOpen = initialOpen ? !userCollapsed : storedExpanded;

  function toggle() {
    if (initialOpen) {
      setUserCollapsed((collapsed) => !collapsed);
      return;
    }

    const next = !storedExpanded;
    writePanelOpen(storageKey, next);
    notifyPanel(storageKey);
  }

  return (
    <section
      className={cn(
        "mb-8",
        combinedWhenOpen &&
          isOpen &&
          "overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-card",
        className,
      )}
      aria-labelledby={`${panelId}-heading`}
    >
      <button
        type="button"
        id={`${panelId}-heading`}
        aria-expanded={isOpen}
        onClick={toggle}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
          combinedWhenOpen && isOpen
            ? "rounded-none border-0 border-b border-border bg-transparent hover:bg-accent-subtle/30"
            : "rounded-2xl border border-border-strong bg-surface hover:border-accent/50",
        )}
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

      {isOpen ? (
        <div
          className={cn("space-y-8", combinedWhenOpen ? "p-4 sm:p-5" : "mt-4")}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
