import Link from "next/link";
import { redirect } from "next/navigation";

import { CaptureForm } from "@/components/capture/CaptureForm";
import { WelcomeBanner } from "@/components/capture/WelcomeBanner";
import { AppNav } from "@/components/AppNav";
import { Card } from "@/components/ui/Card";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <PageShell>
      <AppNav current="capture" />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <WelcomeBanner initialVisible={showWelcomeBanner} />

        <PageHeader
          title="Capture a moment"
          description="No pressure to write perfectly. A few honest words are enough."
        />

        <Card padding="lg" className="rounded-[1.5rem]">
          <CaptureForm userId={user.id} />
        </Card>

        <p className="mt-4 text-center text-sm text-muted">
          <Link
            href="/timeline"
            className="underline-offset-4 transition hover:text-accent hover:underline"
          >
            Back to your journal
          </Link>
        </p>
      </main>
    </PageShell>
  );
}
