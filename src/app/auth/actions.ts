"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { type AuthFormState, validateAuthFields } from "@/lib/auth/validation";
import { toUserErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export async function login(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validationError = validateAuthFields(
    formData.get("email"),
    formData.get("password"),
  );

  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")).trim(),
    password: String(formData.get("password")),
  });

  if (error) {
    return {
      error: toUserErrorMessage(error, "Could not log in. Please try again."),
    };
  }

  revalidatePath("/", "layout");
  redirect("/timeline");
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validationError = validateAuthFields(
    formData.get("email"),
    formData.get("password"),
  );

  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")).trim(),
    password: String(formData.get("password")),
  });

  if (error) {
    return {
      error: toUserErrorMessage(error, "Could not create your account."),
    };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/timeline");
  }

  return {
    message: "Check your email to confirm your account, then log in.",
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
