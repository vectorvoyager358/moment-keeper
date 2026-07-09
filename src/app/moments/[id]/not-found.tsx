import Link from "next/link";

import { AppNav } from "@/components/AppNav";
import { buttonClassName } from "@/components/ui/Button";
import { PageHeader, PageShell } from "@/components/ui/PageShell";

export default function MomentNotFound() {
  return (
    <PageShell>
      <AppNav current="timeline" />
      <main className="mx-auto max-w-2xl px-6 py-10 text-center">
        <PageHeader
          title="Moment not found"
          description="This moment may have been deleted or you do not have access to it."
        />
        <Link href="/timeline" className={buttonClassName()}>
          Back to timeline
        </Link>
      </main>
    </PageShell>
  );
}
