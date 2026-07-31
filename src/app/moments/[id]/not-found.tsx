import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button";
import {
  PageContainer,
  PageHeader,
  PageShell,
} from "@/components/ui/PageShell";

export default function MomentNotFound() {
  return (
    <PageShell>
      <PageContainer size="sm" className="text-center">
        <PageHeader
          title="This moment isn’t here"
          description="It may have been removed, or it might belong to another account."
        />
        <Link href="/timeline" className={buttonClassName()}>
          Back to your journal
        </Link>
      </PageContainer>
    </PageShell>
  );
}
