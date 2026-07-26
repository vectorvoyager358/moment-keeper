import { OnThisDayContent } from "@/components/timeline/OnThisDayContent";
import { toUserErrorMessage } from "@/lib/errors";
import { getOnThisDayMoments } from "@/lib/moments/queries";
import { hasActiveSearchFilters } from "@/lib/moments/search";
import type { TimelineSearchFilters } from "@/lib/moments/search";
import { getRequestTimeZone } from "@/lib/timezone.server";

type OnThisDaySectionProps = {
  filters: TimelineSearchFilters;
};

export async function OnThisDaySection({ filters }: OnThisDaySectionProps) {
  if (hasActiveSearchFilters(filters)) {
    return null;
  }

  const today = new Date();
  const timeZone = await getRequestTimeZone();
  let moments;

  try {
    moments = await getOnThisDayMoments(today, timeZone);
  } catch (error) {
    throw new Error(
      toUserErrorMessage(error, "Could not load on-this-day memories."),
    );
  }

  return (
    <OnThisDayContent
      moments={moments}
      todayIso={today.toISOString()}
      timeZone={timeZone}
    />
  );
}
