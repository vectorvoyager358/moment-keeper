import { NextResponse } from "next/server";

import { getRandomMomentId } from "@/lib/moments/queries";

export async function GET(request: Request) {
  const momentId = await getRandomMomentId();
  const destination = momentId
    ? `/moments/${momentId}`
    : "/timeline?surprise=empty";

  return NextResponse.redirect(new URL(destination, request.url));
}
