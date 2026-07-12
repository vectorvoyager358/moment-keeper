"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { toUserErrorMessage } from "@/lib/errors";
import { saveProfileDisplayName } from "@/lib/profile/save";
import {
  normalizeProfileName,
  validateProfileName,
} from "@/lib/profile/validation";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = {
  error?: string;
  message?: string;
};

export async function updateProfileName(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const rawName = String(formData.get("displayName") ?? "");
  const validationError = validateProfileName(rawName);

  if (validationError) {
    return { error: validationError };
  }

  const displayName = normalizeProfileName(rawName);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "You must be signed in to update your profile." };
  }

  const { error } = await saveProfileDisplayName(
    supabase,
    user.id,
    user.email,
    displayName,
  );

  if (error) {
    return {
      error: toUserErrorMessage(error, "Could not update your profile name."),
    };
  }

  revalidatePath("/settings");
  revalidatePath("/timeline");
  revalidatePath("/capture");
  revalidatePath("/browse");

  const isSetup = formData.get("setup") === "1";
  redirect(isSetup ? "/timeline" : "/settings?profileSaved=1");
}
