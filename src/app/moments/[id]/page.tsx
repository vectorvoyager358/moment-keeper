import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteMomentButton } from "@/components/moments/DeleteMomentButton";
import { MomentDetailNav } from "@/components/moments/MomentDetailNav";
import { MomentDetailPanel } from "@/components/moments/MomentDetailPanel";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/ui/PageShell";
import { SavedToast } from "@/components/ui/SavedToast";
import { toUserErrorMessage } from "@/lib/errors";
import { getAdjacentMomentIds, getMomentById } from "@/lib/moments/queries";

type MomentDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    updated?: string | string[];
  }>;
};

export default async function MomentDetailPage({
  params,
  searchParams,
}: MomentDetailPageProps) {
  const { id } = await params;
  const rawParams = await searchParams;
  const showUpdatedToast = rawParams.updated === "1";

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
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="mb-6 text-sm">
          <Link
            href="/timeline"
            className="text-muted underline-offset-4 transition hover:text-accent hover:underline"
          >
            ← Back to your journal
          </Link>
        </p>

        <SavedToast
          initialVisible={showUpdatedToast}
          queryParam="updated"
          message="Saved — your changes are kept."
        />

        <Card padding="lg" className="rounded-[1.5rem]">
          <MomentDetailPanel moment={moment} />
        </Card>

        <MomentDetailNav
          earlierId={adjacent.earlierId}
          laterId={adjacent.laterId}
        />

        <div className="mt-8 border-t border-border pt-6">
          <DeleteMomentButton momentId={moment.id} />
        </div>
      </main>
    </PageShell>
  );
}
