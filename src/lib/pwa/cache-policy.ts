export const STATIC_ASSET_CACHE_NAME = "moment-keeper-static-assets-v1";

export const LEGACY_RUNTIME_CACHE_NAMES = [
  "google-fonts-webfonts",
  "google-fonts-stylesheets",
  "static-font-assets",
  "static-image-assets",
  "next-static-js-assets",
  "next-image",
  "static-audio-assets",
  "static-video-assets",
  "static-js-assets",
  "static-style-assets",
  "next-data",
  "static-data-assets",
  "apis",
  "pages-rsc-prefetch",
  "pages-rsc",
  "pages",
  "others",
  "cross-origin",
] as const;

export function isSafeStaticAsset(
  sameOrigin: boolean,
  pathname: string,
): boolean {
  return sameOrigin && pathname.startsWith("/_next/static/");
}
