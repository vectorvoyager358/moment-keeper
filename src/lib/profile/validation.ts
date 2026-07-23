export const MAX_PROFILE_NAME_LENGTH = 20;

export function normalizeProfileName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function validateProfileName(value: string): string | null {
  const normalized = normalizeProfileName(value);

  if (!normalized) {
    return "Enter a name.";
  }

  if (normalized.length > MAX_PROFILE_NAME_LENGTH) {
    return `Name must be ${MAX_PROFILE_NAME_LENGTH} characters or fewer.`;
  }

  return null;
}

export function formatProfileName(value: string | null | undefined): string {
  return normalizeProfileName(value ?? "");
}

export function hasProfileName(value: string | null | undefined): boolean {
  return formatProfileName(value).length > 0;
}

export function getProfileNameFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const displayName = Reflect.get(metadata, "display_name");
  return typeof displayName === "string" ? displayName : null;
}

/** Title-case each word for journal display (e.g. "john doe" → "John Doe"). */
export function formatProfileNameForDisplay(value: string): string {
  const normalized = formatProfileName(value);

  if (!normalized) {
    return "";
  }

  return normalized
    .split(" ")
    .map((word) =>
      word.length === 0
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}
