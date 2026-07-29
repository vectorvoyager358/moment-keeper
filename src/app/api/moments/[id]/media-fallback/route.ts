import { NextResponse } from "next/server";

import { toUserErrorMessage } from "@/lib/errors";
import {
  getMomentAttachmentFallbackUrl,
  getMomentPhotoFallbackUrl,
} from "@/lib/moments/media-fallback";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const mediaId = new URL(request.url).searchParams.get("mediaId");
    const url = mediaId
      ? await getMomentAttachmentFallbackUrl(id, mediaId)
      : await getMomentPhotoFallbackUrl(id);

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
