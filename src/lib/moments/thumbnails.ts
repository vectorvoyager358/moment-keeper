export const THUMBNAIL_MAX_EDGE = 480;
export const THUMBNAIL_JPEG_QUALITY = 72;

export function thumbnailStoragePath(storagePath: string): string {
  const slash = storagePath.lastIndexOf("/");
  const dir = slash >= 0 ? storagePath.slice(0, slash + 1) : "";
  const file = slash >= 0 ? storagePath.slice(slash + 1) : storagePath;
  const base = file.replace(/\.[^.]+$/, "") || "photo";
  return `${dir}${base}.thumb.jpg`;
}

export function shouldGenerateThumbnail(
  mediaType: string,
  mimeType: string,
): boolean {
  return (
    mediaType === "photo" &&
    (mimeType === "image/jpeg" ||
      mimeType === "image/png" ||
      mimeType === "image/webp" ||
      mimeType === "image/gif")
  );
}
