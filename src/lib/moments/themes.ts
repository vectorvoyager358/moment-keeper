import type { MediaType, MemoryTheme } from "@/lib/database.types";

export const MAX_MEMORY_THEMES = 3;
export const RESURFACED_MOMENT_LIMIT = 6;

export const MEMORY_THEME_OPTIONS: ReadonlyArray<{
  value: MemoryTheme;
  label: string;
  description: string;
}> = [
  { value: "joy", label: "Joy", description: "Smiles and happy moments" },
  {
    value: "achievement",
    label: "Achievements",
    description: "Wins and milestones",
  },
  {
    value: "growth",
    label: "Growth & recovery",
    description: "Progress and resilience",
  },
  {
    value: "gratitude",
    label: "Gratitude",
    description: "People and things you appreciate",
  },
  {
    value: "connection",
    label: "Connection",
    description: "Love, friendship, and support",
  },
  {
    value: "adventure",
    label: "Adventures",
    description: "Travel and new experiences",
  },
  { value: "calm", label: "Calm", description: "Peaceful and quiet moments" },
];

const MEMORY_THEME_VALUES = new Set<MemoryTheme>(
  MEMORY_THEME_OPTIONS.map((option) => option.value),
);

export type ResurfacingFilters = {
  themes: MemoryTheme[];
  mediaType: MediaType | null;
};

export function isMemoryTheme(value: string): value is MemoryTheme {
  return MEMORY_THEME_VALUES.has(value as MemoryTheme);
}

export function parseMemoryThemeFormData(
  formData: FormData,
): { themes: MemoryTheme[]; error: null } | { themes: []; error: string } {
  const rawThemes = formData.getAll("theme");

  if (
    rawThemes.some(
      (value) => typeof value !== "string" || !isMemoryTheme(value),
    )
  ) {
    return { themes: [], error: "Choose valid memory themes." };
  }

  const themes = [...new Set(rawThemes as MemoryTheme[])];

  if (themes.length > MAX_MEMORY_THEMES) {
    return {
      themes: [],
      error: `Choose up to ${MAX_MEMORY_THEMES} memory themes.`,
    };
  }

  return { themes, error: null };
}

export function parseResurfacingParams(params: {
  theme?: string | string[];
  media?: string | string[];
}): ResurfacingFilters {
  const rawThemes = Array.isArray(params.theme)
    ? params.theme
    : params.theme
      ? [params.theme]
      : [];
  const themes = [
    ...new Set(rawThemes.filter((value) => isMemoryTheme(value))),
  ].slice(0, MAX_MEMORY_THEMES);
  const media = typeof params.media === "string" ? params.media : null;
  const mediaType =
    media === "photo" || media === "video" || media === "audio" ? media : null;

  return { themes, mediaType };
}

export function hasActiveResurfacingFilters(
  filters: ResurfacingFilters,
): boolean {
  return filters.themes.length > 0;
}

export function memoryThemeLabel(theme: MemoryTheme): string {
  return (
    MEMORY_THEME_OPTIONS.find((option) => option.value === theme)?.label ??
    theme
  );
}
