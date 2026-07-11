"use client";

import { useSyncExternalStore } from "react";

import { formatMomentDate } from "@/lib/moments/dates";

type MomentDateProps = {
  iso: string;
  className?: string;
};

function subscribeToClientEnvironment() {
  return () => {};
}

export function MomentDate({ iso, className }: MomentDateProps) {
  const isClient = useSyncExternalStore(
    subscribeToClientEnvironment,
    () => true,
    () => false,
  );

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {isClient ? formatMomentDate(iso) : formatMomentDate(iso, "UTC")}
    </time>
  );
}
