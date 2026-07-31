import { Card } from "@/components/ui/Card";
import { PageContainer, PageShell } from "@/components/ui/PageShell";

export default function SettingsLoading() {
  return (
    <PageShell>
      <PageContainer>
        <p className="sr-only">Opening your account</p>

        <div className="mb-8 animate-pulse space-y-2" aria-hidden="true">
          <div className="h-8 w-40 rounded bg-border" />
          <div className="h-4 w-full max-w-md rounded bg-border" />
        </div>

        <Card padding="lg" className="animate-pulse space-y-4" aria-hidden>
          <div className="h-5 w-28 rounded bg-border" />
          <div className="h-11 w-full rounded-lg bg-border" />
          <div className="h-4 w-2/3 rounded bg-border" />
          <div className="h-10 w-24 rounded-lg bg-border" />
        </Card>

        <Card padding="lg" className="mt-6 animate-pulse space-y-3" aria-hidden>
          <div className="h-4 w-32 rounded bg-border" />
          <div className="h-6 w-44 rounded bg-border" />
          <div className="h-10 w-24 rounded-lg bg-border" />
        </Card>

        <Card padding="lg" className="mt-6 animate-pulse space-y-4" aria-hidden>
          <div className="h-5 w-36 rounded bg-border" />
          <div className="h-4 w-64 max-w-full rounded bg-border" />
          <div className="h-11 w-full rounded-lg bg-border" />
        </Card>
      </PageContainer>
    </PageShell>
  );
}
