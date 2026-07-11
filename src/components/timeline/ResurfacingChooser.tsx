"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { MediaType, MemoryTheme } from "@/lib/database.types";
import { MAX_MEMORY_THEMES, MEMORY_THEME_OPTIONS } from "@/lib/moments/themes";
import { cn } from "@/lib/cn";

export function ResurfacingChooser() {
  const router = useRouter();
  const [themes, setThemes] = useState<MemoryTheme[]>([]);
  const [mediaType, setMediaType] = useState<MediaType | "all">("all");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (themes.length === 0) {
      return;
    }

    const params = new URLSearchParams();
    themes.forEach((theme) => params.append("theme", theme));

    if (mediaType !== "all") {
      params.set("media", mediaType);
    }

    router.push(`/timeline?${params.toString()}`);
  }

  return (
    <Card
      padding="lg"
      className="mb-8 overflow-hidden border-accent/15 bg-gradient-to-br from-surface to-accent-subtle/55"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              What would you like to revisit?
            </h2>
            <p className="mt-1 text-sm text-muted">
              Choose up to {MAX_MEMORY_THEMES}. We&apos;ll look at both themes
              and the words in your memories.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {MEMORY_THEME_OPTIONS.map((option) => {
            const selected = themes.includes(option.value);
            const disabled = themes.length >= MAX_MEMORY_THEMES && !selected;

            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                title={option.description}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-40",
                  selected
                    ? "border-accent bg-accent text-white"
                    : "border-border-strong bg-surface text-tag-text hover:border-accent/50 hover:text-accent",
                )}
                onClick={() => {
                  setThemes((current) =>
                    selected
                      ? current.filter((theme) => theme !== option.value)
                      : [...current, option.value],
                  );
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="text-sm font-medium text-ink">
            Media
            <select
              value={mediaType}
              onChange={(event) =>
                setMediaType(event.target.value as MediaType | "all")
              }
              className="mt-1 block rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">All moments</option>
              <option value="photo">Photos</option>
              <option value="video">Videos</option>
              <option value="audio">Voice and audio</option>
            </select>
          </label>

          <Button type="submit" disabled={themes.length === 0}>
            Show me memories
          </Button>
        </div>
      </form>
    </Card>
  );
}
