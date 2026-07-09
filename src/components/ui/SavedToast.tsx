"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SavedToastProps = {
  initialVisible: boolean;
};

export function SavedToast({ initialVisible }: SavedToastProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(initialVisible);

  useEffect(() => {
    if (!initialVisible) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("saved");
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    router.replace(nextUrl, { scroll: false });

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [initialVisible, router]);

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
      <p className="text-sm font-medium">
        Moment saved — it&apos;s on your timeline.
      </p>
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
