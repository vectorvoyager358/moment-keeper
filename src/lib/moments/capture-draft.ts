import type { MemoryTheme } from "@/lib/database.types";
import {
  normalizeRichTextDocument,
  type RichTextDocument,
} from "@/lib/moments/rich-text";
import { isMemoryTheme, MAX_MEMORY_THEMES } from "@/lib/moments/themes";

export type CaptureDraft = {
  body: string;
  bodyContent: RichTextDocument | null;
  occurredAt: string;
  tags: string;
  location: string;
  linkUrl: string;
  themes: MemoryTheme[];
  isFavorite: boolean;
};

const CAPTURE_DRAFT_PREFIX = "moment-keeper:capture-draft:";

function getDraftKey(userId: string): string {
  return `${CAPTURE_DRAFT_PREFIX}${userId}`;
}

export function readCaptureDraft(userId: string): CaptureDraft | null {
  try {
    const stored = localStorage.getItem(getDraftKey(userId));

    if (!stored) {
      return null;
    }

    const draft: unknown = JSON.parse(stored);

    if (
      typeof draft !== "object" ||
      draft === null ||
      !("body" in draft) ||
      typeof draft.body !== "string" ||
      !("occurredAt" in draft) ||
      typeof draft.occurredAt !== "string" ||
      !("tags" in draft) ||
      typeof draft.tags !== "string"
    ) {
      return null;
    }

    const location =
      "location" in draft && typeof draft.location === "string"
        ? draft.location
        : "";

    const linkUrl =
      "linkUrl" in draft && typeof draft.linkUrl === "string"
        ? draft.linkUrl
        : "";

    const bodyContent =
      "bodyContent" in draft
        ? normalizeRichTextDocument(draft.bodyContent)
        : null;

    const themes =
      "themes" in draft && Array.isArray(draft.themes)
        ? [
            ...new Set(
              draft.themes.filter(
                (theme): theme is MemoryTheme =>
                  typeof theme === "string" && isMemoryTheme(theme),
              ),
            ),
          ].slice(0, MAX_MEMORY_THEMES)
        : [];

    const isFavorite =
      "isFavorite" in draft && typeof draft.isFavorite === "boolean"
        ? draft.isFavorite
        : false;

    return {
      body: draft.body,
      bodyContent,
      occurredAt: draft.occurredAt,
      tags: draft.tags,
      location,
      linkUrl,
      themes,
      isFavorite,
    };
  } catch {
    return null;
  }
}

export function writeCaptureDraft(
  userId: string,
  draft: CaptureDraft,
): boolean {
  if (
    !draft.body.trim() &&
    !draft.tags.trim() &&
    !draft.location.trim() &&
    !draft.linkUrl.trim() &&
    draft.themes.length === 0 &&
    !draft.isFavorite
  ) {
    clearCaptureDraft(userId);
    return false;
  }

  try {
    localStorage.setItem(getDraftKey(userId), JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearCaptureDraft(userId: string): void {
  try {
    localStorage.removeItem(getDraftKey(userId));
  } catch {
    // Local storage can be unavailable in restricted browser modes.
  }
}
