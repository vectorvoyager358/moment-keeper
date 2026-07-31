import { Suspense } from "react";

import { BrowseTabs } from "@/components/browse/BrowseTabs";
import { CalendarView } from "@/components/browse/CalendarView";
import { MediaGallery } from "@/components/browse/MediaGallery";
import { KeepMomentLink } from "@/components/KeepMomentLink";
import {
  PageContainer,
  PageHeader,
  PageShell,
} from "@/components/ui/PageShell";
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
      <PageContainer size="xl">
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
                className="h-[32rem] animate-pulse rounded-3xl bg-surface shadow-card ring-1 ring-border/60"
                aria-hidden
              />
            }
          >
            {view === "calendar" ? (
              <div className="mx-auto max-w-4xl">
                <CalendarView
                  year={calendar.year}
                  month={calendar.month}
                  selectedDay={calendar.day}
                />
              </div>
            ) : (
              <MediaGallery mediaType={mediaType} />
            )}
          </Suspense>
        </div>
      </PageContainer>
      <ScrollToTopButton />
    </PageShell>
  );
}
