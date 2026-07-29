import "server-only";

import * as Sentry from "@sentry/nextjs";

type TimingAttribute = string | number | boolean;
type TimingAttributes = Record<string, TimingAttribute>;

function roundedMilliseconds(startedAt: number): number {
  return Math.round((performance.now() - startedAt) * 10) / 10;
}

export async function measureServerOperation<T>(
  name: string,
  attributes: TimingAttributes,
  operation: () => Promise<T>,
): Promise<T> {
  const startedAt = performance.now();

  return Sentry.startSpan(
    {
      name,
      op: "moment-keeper.performance",
      attributes,
    },
    async () => {
      try {
        return await operation();
      } finally {
        const durationMs = roundedMilliseconds(startedAt);

        if (process.env.NEXT_PUBLIC_PERFORMANCE_LOGGING === "true") {
          console.info("[performance]", {
            name,
            durationMs,
            ...attributes,
          });
        }
      }
    },
  );
}
