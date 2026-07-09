"use server";

import { redirect } from "next/navigation";

import { saveNewMoment } from "@/lib/moments/save";
import type { CaptureFormState } from "@/lib/moments/types";

export async function createMoment(
  _prevState: CaptureFormState,
  formData: FormData,
): Promise<CaptureFormState> {
  const result = await saveNewMoment(formData);

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(result.redirectTo);
}
