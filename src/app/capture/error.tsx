"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

import { toUserErrorMessage } from "@/lib/errors";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/ui/PageShell";

type CaptureErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CaptureError({ error, reset }: CaptureErrorProps) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <PageShell>
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Card
          padding="lg"
          className="border-danger/30 bg-danger-subtle text-center"
        >
          <h1 className="font-display text-lg font-semibold text-danger">
            Could not save your moment
          </h1>
          <p className="mt-2 text-sm text-danger/90">
            {toUserErrorMessage(
              error,
              "Something went wrong while saving. Please try again.",
            )}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button type="button" variant="danger" onClick={reset}>
              Try again
            </Button>
            <Link
              href="/timeline"
              className={buttonClassName({ variant: "secondary" })}
            >
              Back to your journal
            </Link>
          </div>
        </Card>
      </main>
    </PageShell>
  );
}
