import Link from "next/link";
import { notFound } from "next/navigation";

import { AppNav } from "@/components/AppNav";
import { DeleteMomentButton } from "@/components/moments/DeleteMomentButton";
import { MomentDetailPanel } from "@/components/moments/MomentDetailPanel";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/ui/PageShell";
import { toUserErrorMessage } from "@/lib/errors";
import { getMomentById } from "@/lib/moments/queries";

type MomentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MomentDetailPage({
  params,
}: MomentDetailPageProps) {
  const { id } = await params;

  let moment;

  try {
    moment = await getMomentById(id);
  } catch (error) {
    throw new Error(toUserErrorMessage(error, "Could not load this moment."));
  }

  if (!moment) {
    notFound();
  }

  return (
    <PageShell>
      <AppNav current="timeline" />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="mb-6 text-sm">
          <Link
            href="/timeline"
            className="text-muted underline-offset-4 transition hover:text-accent hover:underline"
          >
            ← Back to timeline
          </Link>
        </p>

        <Card padding="lg">
          <MomentDetailPanel moment={moment} />
        </Card>

        <div className="mt-8 border-t border-border pt-6">
          <DeleteMomentButton momentId={moment.id} />
        </div>
      </main>
    </PageShell>
  );
}
