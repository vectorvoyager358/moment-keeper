"use client";

import type { MemoryTheme } from "@/lib/database.types";
import { MAX_MEMORY_THEMES, MEMORY_THEME_OPTIONS } from "@/lib/moments/themes";
import { cn } from "@/lib/cn";

type MemoryThemePickerProps = {
  selected: MemoryTheme[];
  onChange: (themes: MemoryTheme[]) => void;
  disabled?: boolean;
};

export function MemoryThemePicker({
  selected,
  onChange,
  disabled = false,
}: MemoryThemePickerProps) {
  const selectedSet = new Set(selected);
  const atLimit = selected.length >= MAX_MEMORY_THEMES;

  return (
    <fieldset className="space-y-3">
      <div>
        <legend className="text-sm font-medium text-ink">
          What kind of memory is this?{" "}
          <span className="font-normal text-muted">(optional)</span>
        </legend>
        <p className="mt-1 text-xs text-muted">
          Choose up to {MAX_MEMORY_THEMES}. This helps you revisit it later.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {MEMORY_THEME_OPTIONS.map((option) => {
          const checked = selectedSet.has(option.value);
          const optionDisabled = disabled || (atLimit && !checked);

          return (
            <label
              key={option.value}
              title={option.description}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition focus-within:ring-2 focus-within:ring-accent/40",
                checked
                  ? "border-accent bg-accent text-white"
                  : "border-border-strong bg-surface text-tag-text hover:border-accent/50",
                optionDisabled && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                type="checkbox"
                name="theme"
                value={option.value}
                checked={checked}
                disabled={optionDisabled}
                className="sr-only"
                onChange={() => {
                  onChange(
                    checked
                      ? selected.filter((theme) => theme !== option.value)
                      : [...selected, option.value],
                  );
                }}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
