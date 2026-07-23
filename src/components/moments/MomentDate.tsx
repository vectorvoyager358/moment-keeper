"use client";

import { useSyncExternalStore } from "react";

import {
  formatMomentDate,
  formatMomentDateCompact,
  formatMomentDateDetail,
} from "@/lib/moments/dates";

type MomentDateProps = {
  iso: string;
  className?: string;
  compact?: boolean;
  detail?: boolean;
};

function subscribeToClientEnvironment() {
  return () => {};
}

export function MomentDate({
  iso,
  className,
  compact = false,
  detail = false,
}: MomentDateProps) {
  const isClient = useSyncExternalStore(
    subscribeToClientEnvironment,
    () => true,
    () => false,
  );
  const timeZone = isClient ? undefined : "UTC";
  const formatted = detail
    ? formatMomentDateDetail(iso, timeZone)
    : compact
      ? formatMomentDateCompact(iso, timeZone)
      : formatMomentDate(iso, timeZone);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {formatted}
    </time>
  );
}
