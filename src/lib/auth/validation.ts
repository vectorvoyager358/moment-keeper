export type AuthFormState = {
  error?: string;
  message?: string;
};

export function validateAuthFields(
  email: FormDataEntryValue | null,
  password: FormDataEntryValue | null,
): string | null {
  if (typeof email !== "string" || !email.trim().includes("@")) {
    return "Enter a valid email address.";
  }

  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  return null;
}
