"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageContainer, PageShell } from "@/components/ui/PageShell";

type TimelineErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function TimelineError({ error, reset }: TimelineErrorProps) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <PageShell>
      <PageContainer className="py-16">
        <Card
          padding="lg"
          className="bg-danger-subtle text-center ring-danger/25"
        >
          <h1 className="font-display text-lg font-semibold text-danger">
            Could not load your timeline
          </h1>
          <p className="mt-2 text-sm text-danger/90">
            {error.message ||
              "Something went wrong while loading your moments. Please try again."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button type="button" variant="danger" onClick={reset}>
              Try again
            </Button>
            <Link
              href="/login"
              className={buttonClassName({ variant: "secondary" })}
            >
              Log in again
            </Link>
          </div>
        </Card>
      </PageContainer>
    </PageShell>
  );
}
