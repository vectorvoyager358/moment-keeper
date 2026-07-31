import { notFound } from "next/navigation";

import { MomentDetailPanel } from "@/components/moments/MomentDetailPanel";
import { PageContainer, PageShell } from "@/components/ui/PageShell";
import { SavedToast } from "@/components/ui/SavedToast";
import { toUserErrorMessage } from "@/lib/errors";
import { getMomentBackContext } from "@/lib/moments/navigation";
import { getAdjacentMomentIds, getMomentById } from "@/lib/moments/queries";

type MomentDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    updated?: string | string[];
    from?: string | string[];
  }>;
};

export default async function MomentDetailPage({
  params,
  searchParams,
}: MomentDetailPageProps) {
  const { id } = await params;
  const rawParams = await searchParams;
  const showUpdatedToast = rawParams.updated === "1";
  const backContext = getMomentBackContext(rawParams.from);

  let moment;

  try {
    moment = await getMomentById(id);
  } catch (error) {
    throw new Error(toUserErrorMessage(error, "Could not load this moment."));
  }

  if (!moment) {
    notFound();
  }

  const adjacent = await getAdjacentMomentIds(id);

  return (
    <PageShell>
      <PageContainer size="wide" className="px-0 py-0 sm:px-5 sm:py-6">
        <SavedToast
          initialVisible={showUpdatedToast}
          queryParam="updated"
          message="Saved — your changes are kept."
        />

        <MomentDetailPanel
          moment={moment}
          earlierId={adjacent.earlierId}
          laterId={adjacent.laterId}
          backHref={backContext.href}
          backLabel={backContext.label}
        />
      </PageContainer>
    </PageShell>
  );
}
