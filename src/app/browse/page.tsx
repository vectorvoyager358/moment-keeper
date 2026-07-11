import { PenLine } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { AppNav } from "@/components/AppNav";
import { BrowseTabs } from "@/components/browse/BrowseTabs";
import { CalendarView } from "@/components/browse/CalendarView";
import { MediaGallery } from "@/components/browse/MediaGallery";
import { buttonClassName } from "@/components/ui/Button";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import type { MediaType } from "@/lib/database.types";
import { parseCalendarParams } from "@/lib/moments/calendar";

type BrowsePageProps = {
  searchParams: Promise<{
    view?: string | string[];
    year?: string | string[];
    month?: string | string[];
    day?: string | string[];
    date?: string | string[];
    media?: string | string[];
  }>;
};

function parseMediaType(
  value: string | string[] | undefined,
): MediaType | null {
  return value === "photo" || value === "video" || value === "audio"
    ? value
    : null;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const view = params.view === "media" ? "media" : "calendar";
  const calendar = parseCalendarParams(params);
  const mediaType = parseMediaType(params.media);

  return (
    <PageShell>
      <AppNav current="browse" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <PageHeader
          title="Look back"
          description="Wander by date, or revisit the moments you've captured."
          action={
            <Link href="/capture" className={buttonClassName({ size: "sm" })}>
              <PenLine className="h-4 w-4" aria-hidden />
              Keep a moment
            </Link>
          }
        />

        <BrowseTabs active={view} />

        <Suspense
          key={
            view === "calendar"
              ? `${calendar.year}-${calendar.month}-${calendar.day ?? ""}`
              : `media-${mediaType ?? "all"}`
          }
          fallback={
            <div
              className="h-[32rem] animate-pulse rounded-[1.5rem] border border-border bg-surface"
              aria-hidden
            />
          }
        >
          {view === "calendar" ? (
            <CalendarView
              year={calendar.year}
              month={calendar.month}
              selectedDay={calendar.day}
            />
          ) : (
            <MediaGallery mediaType={mediaType} />
          )}
        </Suspense>
      </main>
    </PageShell>
  );
}
