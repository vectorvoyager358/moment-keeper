"use client";

import { useEffect } from "react";

import { invalidateAllViewCaches } from "@/lib/moments/view-cache";

export function InvalidateViewCaches() {
  useEffect(() => {
    invalidateAllViewCaches();
  }, []);

  return null;
}
