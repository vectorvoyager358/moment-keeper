"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { toUserErrorMessage } from "@/lib/errors";
import { removeMediaAttachmentsForMoment } from "@/lib/moments/media-storage";
import { saveUpdatedMoment } from "@/lib/moments/save";
import type { CaptureFormState } from "@/lib/moments/types";
import { createClient } from "@/lib/supabase/server";

export async function updateMoment(
  momentId: string,
  _prevState: CaptureFormState,
  formData: FormData,
): Promise<CaptureFormState> {
  const result = await saveUpdatedMoment(momentId, formData);

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(result.redirectTo);
}

export async function deleteMoment(momentId: string): Promise<void> {
  const supabase = await createClient();

  try {
    await removeMediaAttachmentsForMoment(supabase, momentId);
  } catch (error) {
    throw new Error(
      toUserErrorMessage(error, "Could not delete moment media."),
    );
  }

  const { error } = await supabase.from("moments").delete().eq("id", momentId);

  if (error) {
    throw new Error(toUserErrorMessage(error, "Could not delete this moment."));
  }

  revalidatePath("/timeline");
  redirect("/timeline");
}
