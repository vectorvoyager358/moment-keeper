import type { Metadata } from "next";

import { OfflineReloadButton } from "@/components/pwa/OfflineReloadButton";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Offline — Moment Keeper",
  description: "You are offline. Reconnect to sync your journal.",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-4 py-12">
      <Card className="max-w-md space-y-4 text-center">
        <h1 className="font-display text-2xl text-ink">You&apos;re offline</h1>
        <p className="text-sm text-muted">
          Moment Keeper needs a connection to load your journal. Check your
          network, then try again.
        </p>
        <OfflineReloadButton />
      </Card>
    </main>
  );
}
