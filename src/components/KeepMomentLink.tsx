import { PenLine } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type KeepMomentLinkProps = {
  className?: string;
};

export function KeepMomentLink({ className }: KeepMomentLinkProps) {
  return (
    <Link
      href="/capture"
      aria-label="Keep a moment"
      className={buttonClassName({
        size: "sm",
        className: cn(
          "h-10 w-10 shrink-0 rounded-full p-0 sm:h-auto sm:w-auto sm:rounded-xl sm:px-3.5",
          className,
        ),
      })}
    >
      <PenLine className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">Keep a moment</span>
    </Link>
  );
}
