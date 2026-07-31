import Link from "next/link";
import { redirect } from "next/navigation";

import { CaptureForm } from "@/components/capture/CaptureForm";
import { WelcomeBanner } from "@/components/capture/WelcomeBanner";
import { Card } from "@/components/ui/Card";
import {
  PageContainer,
  PageHeader,
  PageShell,
} from "@/components/ui/PageShell";
import { createClient } from "@/lib/supabase/server";

type CapturePageProps = {
  searchParams: Promise<{
    welcome?: string | string[];
  }>;
};

export default async function CapturePage({ searchParams }: CapturePageProps) {
  const rawParams = await searchParams;
  const showWelcomeBanner = rawParams.welcome === "1";
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    redirect("/login");
  }

  return (
    <PageShell>
      <PageContainer size="sm">
        <WelcomeBanner initialVisible={showWelcomeBanner} />

        <PageHeader
          title="Capture a moment"
          description="No pressure to write perfectly. A few honest words are enough."
        />

        <Card padding="lg">
          <CaptureForm userId={userId} />
        </Card>

        <p className="mt-4 text-center text-sm text-muted">
          <Link
            href="/timeline"
            className="underline-offset-4 transition hover:text-accent hover:underline"
          >
            Back to your journal
          </Link>
        </p>
      </PageContainer>
    </PageShell>
  );
}
