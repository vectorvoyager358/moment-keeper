import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    // Keep in sync with MEDIA_SIZE_LIMITS.video (50 MB) + form overhead.
    serverActions: {
      bodySizeLimit: "52mb",
    },
    // Next.js proxy/middleware buffers request bodies (default 10 MB).
    // Without this, audio/video uploads above 10 MB become "Unexpected end of form".
    proxyClientMaxBodySize: "52mb",
  },
};

export default withSentryConfig(nextConfig, {
  // Optional: set these + SENTRY_AUTH_TOKEN in CI to upload source maps.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Disable source-map upload noise when auth/org/project are unset.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
