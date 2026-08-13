import { BrowseContent } from "@/components/browse/BrowseContent";
import { BrowseTabs } from "@/components/browse/BrowseTabs";
import { KeepMomentLink } from "@/components/KeepMomentLink";
import {
  PageContainer,
  PageHeader,
  PageShell,
} from "@/components/ui/PageShell";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
import type { MediaType } from "@/lib/database.types";
import { parseCalendarParams } from "@/lib/moments/calendar";
import { calendarViewKey } from "@/lib/moments/view-cache";

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
          {view === "calendar" ? (
            <BrowseContent
              key={calendarViewKey(calendar.year, calendar.month)}
              view="calendar"
              calendar={calendar}
              selectedDay={calendar.day}
            />
          ) : (
            <BrowseContent key="media" view="media" mediaType={mediaType} />
          )}
        </div>
      </PageContainer>
      <ScrollToTopButton />
    </PageShell>
  );
}
