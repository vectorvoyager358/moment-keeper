import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button";
import { PageHeader, PageShell } from "@/components/ui/PageShell";

export default function MomentNotFound() {
  return (
    <PageShell>
      <main className="mx-auto max-w-2xl px-6 py-10 text-center">
        <PageHeader
          title="This moment isn’t here"
          description="It may have been removed, or it might belong to another account."
        />
        <Link href="/timeline" className={buttonClassName()}>
          Back to your journal
        </Link>
      </main>
    </PageShell>
  );
}
