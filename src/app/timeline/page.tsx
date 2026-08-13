import { after } from "next/server";
import { Suspense } from "react";

import {
  cleanupExpiredDeletedMoments,
  finalizeDeletedMoment,
  undoDeleteMoment,
} from "@/app/moments/[id]/actions";
import { JournalGreeting } from "@/components/timeline/JournalGreeting";
import { JournalMoments } from "@/components/timeline/JournalMoments";
import { PageContainer, PageShell } from "@/components/ui/PageShell";
import { SavedToast } from "@/components/ui/SavedToast";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
import { parseSearchParams } from "@/lib/moments/search";
import { parseResurfacingParams } from "@/lib/moments/themes";
import { MOMENT_DELETE_UNDO_MS } from "@/lib/moments/delete-undo";
import { isUuid } from "@/lib/moments/direct-upload";
import { getUserProfile } from "@/lib/profile/queries";
import { formatProfileNameForDisplay } from "@/lib/profile/validation";
import { timelineViewKey } from "@/lib/moments/view-cache";

type TimelinePageProps = {
  searchParams: Promise<{
    q?: string | string[];
    tag?: string | string[];
    favorite?: string | string[];
    saved?: string | string[];
    deleted?: string | string[];
    theme?: string | string[];
    media?: string | string[];
    surprise?: string | string[];
  }>;
};

export default async function TimelinePage({
  searchParams,
}: TimelinePageProps) {
  const rawParams = await searchParams;
  const filters = parseSearchParams(rawParams);
  const resurfacingFilters = parseResurfacingParams(rawParams);
  const showSavedToast = rawParams.saved === "1";
  const deletedMomentId =
    typeof rawParams.deleted === "string" && isUuid(rawParams.deleted)
      ? rawParams.deleted
      : null;
  const profilePromise = getUserProfile();

  after(async () => {
    await cleanupExpiredDeletedMoments();
  });

  return (
    <PageShell>
      <PageContainer size="xl" className="pt-6 pb-8 sm:pt-9 sm:pb-12">
        <header className="mb-7 min-w-0 px-1 pt-1 sm:mb-10 sm:px-2 sm:pt-2">
          <Suspense
            fallback={<div className="h-12 sm:h-16" aria-hidden="true" />}
          >
            <TimelineGreeting profilePromise={profilePromise} />
          </Suspense>
        </header>

        <SavedToast
          initialVisible={Boolean(deletedMomentId)}
          queryParam="deleted"
          message="Moment deleted."
          autoDismissMs={MOMENT_DELETE_UNDO_MS}
          actionLabel="Undo"
          onAction={
            deletedMomentId
              ? undoDeleteMoment.bind(null, deletedMomentId)
              : undefined
          }
          onExpire={
            deletedMomentId
              ? finalizeDeletedMoment.bind(null, deletedMomentId)
              : undefined
          }
        />

        <JournalMoments
          key={timelineViewKey(filters)}
          filters={filters}
          resurfacingFilters={resurfacingFilters}
          showSavedToast={showSavedToast}
          showEmptySurprise={rawParams.surprise === "empty"}
          deletedMomentId={deletedMomentId}
        />
      </PageContainer>
      <ScrollToTopButton />
    </PageShell>
  );
}

async function TimelineGreeting({
  profilePromise,
}: {
  profilePromise: ReturnType<typeof getUserProfile>;
}) {
  const profile = await profilePromise;

  return (
    <JournalGreeting
      name={
        profile?.hasDisplayName
          ? formatProfileNameForDisplay(profile.displayName)
          : "there"
      }
    />
  );
}
