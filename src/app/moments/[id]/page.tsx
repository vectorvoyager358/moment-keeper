import Link from "next/link";
import { notFound } from "next/navigation";

import { AppNav } from "@/components/AppNav";
import { DeleteMomentButton } from "@/components/moments/DeleteMomentButton";
import { MomentDetailPanel } from "@/components/moments/MomentDetailPanel";
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
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <AppNav current="timeline" />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="mb-6 text-sm">
          <Link
            href="/timeline"
            className="text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            ← Back to timeline
          </Link>
        </p>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <MomentDetailPanel moment={moment} />
        </section>

        <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <DeleteMomentButton momentId={moment.id} />
        </div>
      </main>
    </div>
  );
}
