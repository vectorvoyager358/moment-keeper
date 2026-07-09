"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSiteOrigin } from "@/lib/auth/origin";
import {
  type AuthFormState,
  validateAuthFields,
  validateChangePassword,
  validateEmail,
  validateNewPassword,
} from "@/lib/auth/validation";
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
    redirect("/capture?welcome=1");
  }

  return {
    message: "Check your email to confirm your account, then log in.",
  };
}

export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validationError = validateEmail(formData.get("email"));

  if (validationError) {
    return { error: validationError };
  }

  const email = String(formData.get("email")).trim();
  const origin = await getSiteOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return {
      error: toUserErrorMessage(
        error,
        "Could not send a reset email. Please try again.",
      ),
    };
  }

  // Same message whether or not the email exists — avoid account enumeration.
  return {
    message:
      "If an account exists for that email, we sent a link to reset your password.",
  };
}

export async function updatePassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validationError = validateNewPassword(
    formData.get("password"),
    formData.get("confirmPassword"),
  );

  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Your reset link is invalid or has expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: String(formData.get("password")),
  });

  if (error) {
    return {
      error: toUserErrorMessage(
        error,
        "Could not update your password. Please try again.",
      ),
    };
  }

  revalidatePath("/", "layout");
  redirect("/timeline");
}

export async function changePassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validationError = validateChangePassword(
    formData.get("currentPassword"),
    formData.get("password"),
    formData.get("confirmPassword"),
  );

  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "You must be signed in to change your password." };
  }

  const currentPassword = String(formData.get("currentPassword"));
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (reauthError) {
    return { error: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({
    password: String(formData.get("password")),
  });

  if (error) {
    return {
      error: toUserErrorMessage(
        error,
        "Could not update your password. Please try again.",
      ),
    };
  }

  return { message: "Password updated." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
