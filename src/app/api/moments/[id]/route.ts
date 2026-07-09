import { NextResponse } from "next/server";

import { toUserErrorMessage } from "@/lib/errors";
import { saveUpdatedMoment } from "@/lib/moments/save";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const result = await saveUpdatedMoment(id, formData);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }

    return NextResponse.json({ redirectTo: result.redirectTo });
  } catch (error) {
    return NextResponse.json(
      {
        error: toUserErrorMessage(error, "Could not update your moment."),
      },
      { status: 500 },
    );
  }
}
