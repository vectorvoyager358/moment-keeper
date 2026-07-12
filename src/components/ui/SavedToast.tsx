"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const AUTO_DISMISS_MS = 5000;

type SavedToastProps = {
  initialVisible: boolean;
  message?: string;
  queryParam?: string;
  hint?: string | null;
  autoDismissMs?: number;
};

const DEFAULT_MESSAGE = "Saved — it's now part of your journal.";

export function SavedToast({
  initialVisible,
  message = DEFAULT_MESSAGE,
  queryParam = "saved",
  hint = null,
  autoDismissMs = AUTO_DISMISS_MS,
}: SavedToastProps) {
  const router = useRouter();
  const shouldShowRef = useRef(initialVisible);
  const [visible, setVisible] = useState(initialVisible);

  useEffect(() => {
    if (!shouldShowRef.current) {
      return;
    }

    const url = new URL(window.location.href);
    if (url.searchParams.has(queryParam)) {
      url.searchParams.delete(queryParam);
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      router.replace(nextUrl, { scroll: false });
    }

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, autoDismissMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [autoDismissMs, queryParam, router]);

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
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="ml-auto text-sm font-medium text-success/80 transition hover:text-success"
      >
        Dismiss
      </button>
    </div>
  );
}
