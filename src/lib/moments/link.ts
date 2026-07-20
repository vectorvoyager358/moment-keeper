export const MAX_MOMENT_LINK_URL_LENGTH = 2_048;

export type MomentLinkInput =
  | { url: string | null; error: null }
  | { url: null; error: string };

function hasScheme(value: string): boolean {
  return /^[a-z][a-z\d+.-]*:/i.test(value);
}

export function parseMomentLinkUrl(value: string): MomentLinkInput {
  const trimmed = value.trim();

  if (!trimmed) {
    return { url: null, error: null };
  }

  const candidate = hasScheme(trimmed) ? trimmed : `https://${trimmed}`;

  if (candidate.length > MAX_MOMENT_LINK_URL_LENGTH) {
    return {
      url: null,
      error: `Link must be ${MAX_MOMENT_LINK_URL_LENGTH.toLocaleString()} characters or fewer.`,
    };
  }

  try {
    const url = new URL(candidate);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { url: null, error: "Link must use http:// or https://." };
    }

    if (!url.hostname || url.username || url.password) {
      return { url: null, error: "Enter a valid webpage link." };
    }

    const normalized = url.toString();
    if (normalized.length > MAX_MOMENT_LINK_URL_LENGTH) {
      return {
        url: null,
        error: `Link must be ${MAX_MOMENT_LINK_URL_LENGTH.toLocaleString()} characters or fewer.`,
      };
    }

    return { url: normalized, error: null };
  } catch {
    return { url: null, error: "Enter a valid webpage link." };
  }
}

export function parseMomentLinkFormData(formData: FormData): MomentLinkInput {
  return parseMomentLinkUrl(String(formData.get("link_url") ?? ""));
}

export function getMomentLinkHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}
