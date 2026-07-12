import { MapPin } from "lucide-react";

import { cn } from "@/lib/cn";

type MomentLocationProps = {
  location: string;
  className?: string;
  compact?: boolean;
};

export function MomentLocation({
  location,
  className,
  compact = false,
}: MomentLocationProps) {
  return (
    <p
      className={cn(
        "flex min-w-0 items-center gap-1.5 text-muted",
        compact ? "text-xs" : "text-sm",
        className,
      )}
    >
      <MapPin
        className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")}
        aria-hidden
      />
      <span className="truncate">{location}</span>
    </p>
  );
}
