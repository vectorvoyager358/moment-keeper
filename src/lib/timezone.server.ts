import "server-only";

import { cookies } from "next/headers";

import { normalizeTimeZone, TIMEZONE_COOKIE } from "@/lib/timezone";

export async function getRequestTimeZone(): Promise<string> {
  const cookieStore = await cookies();
  return normalizeTimeZone(cookieStore.get(TIMEZONE_COOKIE)?.value);
}
