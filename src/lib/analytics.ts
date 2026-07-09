/**
 * Vercel Web Analytics is enabled by default in production on Vercel.
 * Set NEXT_PUBLIC_ANALYTICS_DISABLED=true to opt out entirely.
 */
export function isAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_DISABLED !== "true";
}
