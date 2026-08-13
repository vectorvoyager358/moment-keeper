"use client";

import { Search, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type TimelineTool = "find" | "revisit";

type TimelineToolsProps = {
  findContent: ReactNode;
  revisitContent: ReactNode;
  revisitPreview?: ReactNode;
  initialTool?: TimelineTool | null;
};

const tools = [
  {
    id: "find" as const,
    label: "Find",
    description: "Search your moments",
    icon: Search,
  },
  {
    id: "revisit" as const,
    label: "Revisit",
    description: "Rediscover a memory",
    icon: Sparkles,
  },
];

export function TimelineTools({
  findContent,
  revisitContent,
  revisitPreview = null,
  initialTool = null,
}: TimelineToolsProps) {
  const [activeTool, setActiveTool] = useState<TimelineTool | null>(
    initialTool,
  );
  const activeContent =
    activeTool === "find"
      ? findContent
      : activeTool === "revisit"
        ? revisitContent
        : null;

  return (
    <section className="mb-6 sm:mb-8" aria-label="Journal tools">
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-surface p-1.5 shadow-card ring-1 ring-border/55">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const active = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              aria-expanded={active}
              aria-controls="timeline-tool-content"
              onClick={() =>
                setActiveTool((current) =>
                  current === tool.id ? null : tool.id,
                )
              }
              className={cn(
                "flex min-h-12 items-center gap-2.5 rounded-xl px-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:min-h-14 sm:px-4",
                active
                  ? "bg-accent-subtle text-accent shadow-[inset_0_0_0_1px_rgba(184,121,46,0.14)]"
                  : "text-muted hover:bg-accent-subtle/45 hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition sm:h-9 sm:w-9",
                  active
                    ? "bg-accent text-white shadow-sm"
                    : "bg-accent-subtle/70 text-accent",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-sm font-semibold text-current sm:text-base">
                  {tool.label}
                </span>
                <span className="hidden truncate text-xs text-muted sm:block">
                  {tool.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {activeContent ? (
        <div
          id="timeline-tool-content"
          className="mt-3 animate-fade-in-up overflow-hidden rounded-3xl bg-surface p-4 shadow-card ring-1 ring-border/55 sm:mt-4 sm:p-6"
        >
          {activeContent}
        </div>
      ) : null}

      {activeTool !== "revisit" ? revisitPreview : null}
    </section>
  );
}
