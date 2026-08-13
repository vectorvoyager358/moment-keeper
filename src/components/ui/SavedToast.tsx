"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { announceRestoredMoment } from "@/lib/moments/restore-event";
import type { TimelineMoment } from "@/lib/moments/timeline";

const AUTO_DISMISS_MS = 5000;

type SavedToastProps = {
  initialVisible: boolean;
  message?: string;
  queryParam?: string;
  hint?: string | null;
  autoDismissMs?: number;
  actionLabel?: string;
  onAction?: () => Promise<{
    error: string | null;
    restoredMoment?: TimelineMoment | null;
  }>;
  onExpire?: () => Promise<void>;
};

const DEFAULT_MESSAGE = "Saved — it's now part of your journal.";

export function SavedToast({
  initialVisible,
  message = DEFAULT_MESSAGE,
  queryParam = "saved",
  hint = null,
  autoDismissMs = AUTO_DISMISS_MS,
  actionLabel,
  onAction,
  onExpire,
}: SavedToastProps) {
  const shouldShowRef = useRef(initialVisible);
  const timerRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);
  const [visible, setVisible] = useState(initialVisible);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!shouldShowRef.current) {
      return;
    }

    const url = new URL(window.location.href);
    if (url.searchParams.has(queryParam)) {
      url.searchParams.delete(queryParam);
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(window.history.state, "", nextUrl);
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setVisible(false);
      void onExpireRef.current?.();
    }, autoDismissMs);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [autoDismissMs, queryParam]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="animate-toast-in mb-6 flex items-center gap-3 rounded-xl border border-success/20 bg-success-subtle px-4 py-3 text-success shadow-card"
      role="status"
      aria-live="polite"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/15">
        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{message}</p>
        {hint ? <p className="mt-1 text-sm text-success/90">{hint}</p> : null}
        {actionError ? (
          <p className="mt-1 text-sm text-danger">{actionError}</p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!onAction) {
            setVisible(false);
            return;
          }

          if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
          }

          startTransition(async () => {
            const result = await onAction();
            if (result.error) {
              setActionError(result.error);
              return;
            }

            if (result.restoredMoment) {
              announceRestoredMoment(result.restoredMoment);
            }

            setVisible(false);
          });
        }}
        className="ml-auto text-sm font-medium text-success/80 transition hover:text-success"
      >
        {isPending ? "Restoring…" : (actionLabel ?? "Dismiss")}
      </button>
    </div>
  );
}
