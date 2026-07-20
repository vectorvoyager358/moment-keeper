import { Suspense } from "react";

import { BrowseTabs } from "@/components/browse/BrowseTabs";
import { CalendarView } from "@/components/browse/CalendarView";
import { MediaGallery } from "@/components/browse/MediaGallery";
import { KeepMomentLink } from "@/components/KeepMomentLink";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
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
  const view = params.view === "calendar" ? "calendar" : "media";
  const calendar = parseCalendarParams(params);
  const mediaType = parseMediaType(params.media);

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <PageHeader
          title="Look back"
          description="Wander by date, or revisit the moments you've captured."
          action={<KeepMomentLink />}
        />

        <BrowseTabs active={view} />

        <div className="mt-8">
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
        </div>
      </main>
      <ScrollToTopButton />
    </PageShell>
  );
}
