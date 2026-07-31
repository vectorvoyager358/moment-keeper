import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type AlertVariant = "error" | "success" | "info";

type AlertProps = HTMLAttributes<HTMLParagraphElement> & {
  variant?: AlertVariant;
};

const variantClasses: Record<AlertVariant, string> = {
  error: "bg-danger-subtle text-danger ring-danger/20",
  success: "bg-success-subtle text-success ring-success/20",
  info: "bg-accent-subtle text-ink ring-accent/15",
};

export function Alert({ variant = "info", className, ...props }: AlertProps) {
  return (
    <p
      className={cn(
        "rounded-2xl px-4 py-3 text-sm leading-relaxed ring-1",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
