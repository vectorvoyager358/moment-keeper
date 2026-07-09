import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type AlertVariant = "error" | "success" | "info";

type AlertProps = HTMLAttributes<HTMLParagraphElement> & {
  variant?: AlertVariant;
};

const variantClasses: Record<AlertVariant, string> = {
  error: "bg-danger-subtle text-danger",
  success: "bg-success-subtle text-success",
  info: "bg-accent-subtle text-ink",
};

export function Alert({ variant = "info", className, ...props }: AlertProps) {
  return (
    <p
      className={cn(
        "rounded-lg px-3 py-2 text-sm",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
