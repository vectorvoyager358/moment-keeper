import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button";

type MomentDetailNavProps = {
  earlierId: string | null;
  laterId: string | null;
};

export function MomentDetailNav({ earlierId, laterId }: MomentDetailNavProps) {
  if (!earlierId && !laterId) {
    return null;
  }

  return (
    <nav
      aria-label="Nearby moments"
      className="flex items-center justify-between gap-3 border-t border-border/80 pt-5"
    >
      {earlierId ? (
        <Link
          href={`/moments/${earlierId}`}
          className={buttonClassName({
            variant: "ghost",
            size: "sm",
            className: "rounded-full px-2 text-muted hover:text-ink",
          })}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Earlier
        </Link>
      ) : (
        <span />
      )}
      {laterId ? (
        <Link
          href={`/moments/${laterId}`}
          className={buttonClassName({
            variant: "ghost",
            size: "sm",
            className: "rounded-full px-2 text-muted hover:text-ink",
          })}
        >
          Later
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
