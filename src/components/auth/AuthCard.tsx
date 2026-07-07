import Link from "next/link";
import type { ReactNode } from "react";

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
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      <main className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>

        {children}

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          <Link
            href={alternateHref}
            className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
          >
            {alternateLabel}
          </Link>
        </p>
      </main>
    </div>
  );
}
