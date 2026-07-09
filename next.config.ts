import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

export default nextConfig;
