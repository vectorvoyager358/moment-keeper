import { Analytics } from "@vercel/analytics/next";

import { isAnalyticsEnabled } from "@/lib/analytics";

export function AnalyticsProvider() {
  if (!isAnalyticsEnabled()) {
    return null;
  }

  return <Analytics />;
}
