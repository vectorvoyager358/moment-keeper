"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { TIMEZONE_COOKIE } from "@/lib/timezone";

function readTimeZoneCookie(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${TIMEZONE_COOKIE}=([^;]*)`),
  );

  if (!match?.[1]) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function writeTimeZoneCookie(timeZone: string) {
  document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(timeZone)};path=/;max-age=31536000;SameSite=Lax`;
}

export function TimezoneSync() {
  const router = useRouter();
  const refreshed = useRef(false);

  useEffect(() => {
    let timeZone: string;

    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }

    if (!timeZone) {
      return;
    }

    const current = readTimeZoneCookie();

    if (current === timeZone) {
      return;
    }

    writeTimeZoneCookie(timeZone);

    if (!refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [router]);

  return null;
}
