import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        "min-h-full pt-[env(safe-area-inset-top)] pb-[calc(6.75rem+env(safe-area-inset-bottom))] md:pt-[4.75rem] md:pb-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

type PageContainerProps = HTMLAttributes<HTMLElement> & {
  size?: "sm" | "md" | "lg" | "xl" | "wide";
};

const pageWidthClasses: Record<
  NonNullable<PageContainerProps["size"]>,
  string
> = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  wide: "max-w-[90rem]",
};

export function PageContainer({
  size = "md",
  className,
  ...props
}: PageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 sm:py-10 lg:px-8",
        pageWidthClasses[size],
        className,
      )}
      {...props}
    />
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
    <div className={cn("mb-8 sm:mb-10", className)}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[2.25rem]">
          {title}
        </h1>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {description ? (
        <p className="mt-2.5 max-w-prose text-sm leading-relaxed text-muted sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
