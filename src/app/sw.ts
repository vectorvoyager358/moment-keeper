/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type {
  PrecacheEntry,
  RuntimeCaching,
  SerwistGlobalConfig,
} from "serwist";
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkOnly,
  Serwist,
} from "serwist";

import {
  isSafeStaticAsset,
  LEGACY_RUNTIME_CACHE_NAMES,
  STATIC_ASSET_CACHE_NAME,
} from "../lib/pwa/cache-policy";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const networkOnly: RuntimeCaching = {
  matcher: /.*/i,
  method: "GET",
  handler: new NetworkOnly(),
};

const runtimeCaching: RuntimeCaching[] =
  process.env.NODE_ENV === "production"
    ? [
        {
          matcher: ({ sameOrigin, url }) =>
            isSafeStaticAsset(sameOrigin, url.pathname),
          method: "GET",
          handler: new CacheFirst({
            cacheName: STATIC_ASSET_CACHE_NAME,
            plugins: [
              new CacheableResponsePlugin({ statuses: [200] }),
              new ExpirationPlugin({
                maxEntries: 128,
                maxAgeSeconds: 30 * 24 * 60 * 60,
                maxAgeFrom: "last-used",
              }),
            ],
          }),
        },
        networkOnly,
      ]
    : [networkOnly];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all(
      LEGACY_RUNTIME_CACHE_NAMES.map((cacheName) => caches.delete(cacheName)),
    ),
  );
});

serwist.addEventListeners();
