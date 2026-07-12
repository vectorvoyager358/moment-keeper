import { validateProfileName } from "@/lib/profile/validation";

export type AuthFormState = {
  error?: string;
  message?: string;
};

export function validateEmail(email: FormDataEntryValue | null): string | null {
  if (typeof email !== "string" || !email.trim().includes("@")) {
    return "Enter a valid email address.";
  }

  return null;
}

export function validatePassword(
  password: FormDataEntryValue | null,
): string | null {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  return null;
}

export function validateAuthFields(
  email: FormDataEntryValue | null,
  password: FormDataEntryValue | null,
): string | null {
  return validateEmail(email) ?? validatePassword(password);
}

export function validateSignupFields(
  displayName: FormDataEntryValue | null,
  email: FormDataEntryValue | null,
  password: FormDataEntryValue | null,
): string | null {
  return (
    validateProfileName(String(displayName ?? "")) ??
    validateAuthFields(email, password)
  );
}

export function validateNewPassword(
  password: FormDataEntryValue | null,
  confirmPassword: FormDataEntryValue | null,
): string | null {
  const passwordError = validatePassword(password);
  if (passwordError) {
    return passwordError;
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}

export function validateChangePassword(
  currentPassword: FormDataEntryValue | null,
  newPassword: FormDataEntryValue | null,
  confirmPassword: FormDataEntryValue | null,
): string | null {
  const currentError = validatePassword(currentPassword);
  if (currentError) {
    return "Enter your current password.";
  }

  const newPasswordError = validateNewPassword(newPassword, confirmPassword);
  if (newPasswordError) {
    return newPasswordError;
  }

  if (currentPassword === newPassword) {
    return "New password must be different from your current password.";
  }

  return null;
}
