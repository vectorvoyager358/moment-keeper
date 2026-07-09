import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { getHealthPayload } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = getHealthPayload({
    supabaseConfigured: isSupabaseConfigured(),
    now: new Date(),
  });

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
