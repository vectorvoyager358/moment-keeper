import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button";

type MomentDetailNavProps = {
  earlierId: string | null;
  laterId: string | null;
  returnTo?: string | null;
};

function momentHref(id: string, returnTo?: string | null) {
  return returnTo
    ? `/moments/${id}?from=${encodeURIComponent(returnTo)}`
    : `/moments/${id}`;
}

export function MomentDetailNav({
  earlierId,
  laterId,
  returnTo,
}: MomentDetailNavProps) {
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
          href={momentHref(earlierId, returnTo)}
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
          href={momentHref(laterId, returnTo)}
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
