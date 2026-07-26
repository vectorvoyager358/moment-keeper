import { ResurfacingChooser } from "@/components/timeline/ResurfacingChooser";
import { ResurfacingContent } from "@/components/timeline/ResurfacingContent";
import { toUserErrorMessage } from "@/lib/errors";
import { getResurfacedMoments } from "@/lib/moments/queries";
import { hasActiveSearchFilters } from "@/lib/moments/search";
import {
  hasActiveResurfacingFilters,
  type ResurfacingFilters,
} from "@/lib/moments/themes";
import type { TimelineSearchFilters } from "@/lib/moments/search";

type ResurfacingSectionProps = {
  searchFilters: TimelineSearchFilters;
  resurfacingFilters: ResurfacingFilters;
};

export async function ResurfacingSection({
  searchFilters,
  resurfacingFilters,
}: ResurfacingSectionProps) {
  if (hasActiveSearchFilters(searchFilters)) {
    return null;
  }

  if (!hasActiveResurfacingFilters(resurfacingFilters)) {
    return <ResurfacingChooser />;
  }

  let moments;

  try {
    moments = await getResurfacedMoments(
      resurfacingFilters.themes,
      resurfacingFilters.mediaType,
    );
  } catch (error) {
    throw new Error(
      toUserErrorMessage(error, "Could not find memories for you."),
    );
  }

  return (
    <ResurfacingContent
      moments={moments}
      resurfacingFilters={resurfacingFilters}
    />
  );
}
