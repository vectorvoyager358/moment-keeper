import Link from "next/link";

import { CaptureForm } from "@/components/capture/CaptureForm";
import { WelcomeBanner } from "@/components/capture/WelcomeBanner";
import { AppNav } from "@/components/AppNav";
import { Card } from "@/components/ui/Card";
import { PageHeader, PageShell } from "@/components/ui/PageShell";

type CapturePageProps = {
  searchParams: Promise<{
    welcome?: string | string[];
  }>;
};

export default async function CapturePage({ searchParams }: CapturePageProps) {
  const rawParams = await searchParams;
  const showWelcomeBanner = rawParams.welcome === "1";

  return (
    <PageShell>
      <AppNav current="capture" />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <WelcomeBanner initialVisible={showWelcomeBanner} />

        <PageHeader
          title="Capture a moment"
          description="A few words is enough. You can always edit later."
        />

        <Card padding="lg">
          <CaptureForm />
        </Card>

        <p className="mt-4 text-center text-sm text-muted">
          <Link
            href="/timeline"
            className="underline-offset-4 transition hover:text-accent hover:underline"
          >
            Back to timeline
          </Link>
        </p>
      </main>
    </PageShell>
  );
}
