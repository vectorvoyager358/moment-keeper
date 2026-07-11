import type { MemoryTheme } from "@/lib/database.types";
import { isMemoryTheme, MAX_MEMORY_THEMES } from "@/lib/moments/themes";

export type CaptureDraft = {
  body: string;
  occurredAt: string;
  tags: string;
  themes: MemoryTheme[];
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

    return {
      body: draft.body,
      occurredAt: draft.occurredAt,
      tags: draft.tags,
      themes,
    };
  } catch {
    return null;
  }
}

export function writeCaptureDraft(
  userId: string,
  draft: CaptureDraft,
): boolean {
  if (!draft.body.trim() && !draft.tags.trim() && draft.themes.length === 0) {
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
