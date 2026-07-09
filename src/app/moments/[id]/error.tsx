"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

type MomentDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function MomentDetailError({
  error,
  reset,
}: MomentDetailErrorProps) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
        <h1 className="text-lg font-medium text-red-900 dark:text-red-100">
          Could not load this moment
        </h1>
        <p className="mt-2 text-sm text-red-800 dark:text-red-200">
          {error.message ||
            "Something went wrong while loading this moment. Please try again."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-red-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 dark:bg-red-100 dark:text-red-900 dark:hover:bg-red-200"
          >
            Try again
          </button>
          <Link
            href="/timeline"
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-900 transition hover:bg-red-100 dark:border-red-800 dark:text-red-100 dark:hover:bg-red-900"
          >
            Back to timeline
          </Link>
        </div>
      </div>
    </div>
  );
}
