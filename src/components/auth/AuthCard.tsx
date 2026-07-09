import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  alternateHref: string;
  alternateLabel: string;
};

export function AuthCard({
  title,
  description,
  children,
  alternateHref,
  alternateLabel,
}: AuthCardProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-paper px-6 py-16">
      <main className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <p className="font-display text-sm font-medium tracking-wide text-accent uppercase">
            Moment Keeper
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-muted">{description}</p>
        </div>

        <Card padding="lg" className="shadow-card">
          {children}
        </Card>

        <p className="text-center text-sm text-muted">
          <Link
            href={alternateHref}
            className="font-medium text-ink underline-offset-4 transition hover:text-accent hover:underline"
          >
            {alternateLabel}
          </Link>
        </p>
      </main>
    </div>
  );
}
