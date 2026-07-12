/** Matches `moments_location_length_check` in the database migration. */
export const MAX_MOMENT_LOCATION_LENGTH = 200;

export function normalizeMomentLocation(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed;
}

export function parseLocationFormData(formData: FormData): string | null {
  return normalizeMomentLocation(String(formData.get("location") ?? ""));
}

export function validateMomentLocation(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  if (value.length > MAX_MOMENT_LOCATION_LENGTH) {
    return `Location must be ${MAX_MOMENT_LOCATION_LENGTH} characters or fewer.`;
  }

  return null;
}
