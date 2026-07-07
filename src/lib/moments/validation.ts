/** Matches `moments_body_length_check` in the database migration. */
export const MAX_MOMENT_BODY_LENGTH = 10_000;

export function validateMomentBody(body: string): string | null {
  const trimmed = body.trim();

  if (!trimmed) {
    return "Moment text is required.";
  }

  if (trimmed.length > MAX_MOMENT_BODY_LENGTH) {
    return `Moment text must be ${MAX_MOMENT_BODY_LENGTH} characters or fewer.`;
  }

  return null;
}

export function normalizeTagName(name: string): string {
  return name.trim();
}

export function validateTagName(name: string): string | null {
  const normalized = normalizeTagName(name);

  if (!normalized) {
    return "Tag name is required.";
  }

  return null;
}
