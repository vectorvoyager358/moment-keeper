import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        "min-h-full pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-10", className)}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[1.625rem] font-semibold leading-none tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {description ? (
        <p className="mt-2.5 max-w-prose text-sm leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
