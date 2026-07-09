import { NextResponse } from "next/server";

import { toUserErrorMessage } from "@/lib/errors";
import { saveNewMoment } from "@/lib/moments/save";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await saveNewMoment(formData);

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
        error: toUserErrorMessage(error, "Could not save your moment."),
      },
      { status: 500 },
    );
  }
}
