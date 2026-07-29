import { NextResponse } from "next/server";

import { toUserErrorMessage } from "@/lib/errors";
import { getMomentPhotoFallbackUrl } from "@/lib/moments/media-fallback";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const url = await getMomentPhotoFallbackUrl(id);

    if (!url) {
      return NextResponse.json(
        { error: "Photo unavailable." },
        {
          status: 404,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    return NextResponse.json(
      { url },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: toUserErrorMessage(error, "Could not load the photo."),
      },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
