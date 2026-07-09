import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type TagProps = HTMLAttributes<HTMLSpanElement> & {
  active?: boolean;
};

export function Tag({ active = false, className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition",
        active ? "bg-accent text-white" : "bg-tag text-tag-text",
        className,
      )}
      {...props}
    />
  );
}
