"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type WelcomeBannerProps = {
  initialVisible: boolean;
};

export function WelcomeBanner({ initialVisible }: WelcomeBannerProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(initialVisible);

  useEffect(() => {
    if (!initialVisible) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("welcome");
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    router.replace(nextUrl, { scroll: false });
  }, [initialVisible, router]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="animate-toast-in mb-6 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent-subtle px-4 py-4 text-ink shadow-card"
      role="status"
      aria-live="polite"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Sparkles className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-semibold">
          Welcome to Moment Keeper
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Capture your first moment below — a few words is enough. You can
          always add photos, tags, or edits later.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="shrink-0 text-sm font-medium text-muted transition hover:text-ink"
      >
        Dismiss
      </button>
    </div>
  );
}
