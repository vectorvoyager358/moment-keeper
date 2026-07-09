import sharp from "sharp";

import {
  THUMBNAIL_JPEG_QUALITY,
  THUMBNAIL_MAX_EDGE,
} from "@/lib/moments/thumbnails";

/**
 * Create a small JPEG thumbnail buffer for timeline cards.
 * Returns null when the input cannot be decoded.
 */
export async function createPhotoThumbnailBuffer(
  input: Buffer,
): Promise<Buffer | null> {
  try {
    return await sharp(input)
      .rotate()
      .resize({
        width: THUMBNAIL_MAX_EDGE,
        height: THUMBNAIL_MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: THUMBNAIL_JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
  } catch {
    return null;
  }
}
