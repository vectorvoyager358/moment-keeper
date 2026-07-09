export const IMAGE_COMPRESS_MAX_EDGE = 1920;
export const IMAGE_COMPRESS_QUALITY = 0.82;
export const IMAGE_COMPRESS_MIN_BYTES = 300_000;

const COMPRESSIBLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function shouldCompressImage(
  file: Pick<File, "type" | "size">,
): boolean {
  return (
    COMPRESSIBLE_TYPES.has(file.type) && file.size >= IMAGE_COMPRESS_MIN_BYTES
  );
}

export function compressedImageName(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, "") || "photo";
  return `${base}.jpg`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };

    image.src = url;
  });
}

function canvasToJpegFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  quality: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not compress that image."));
          return;
        }

        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Downscale and re-encode large photos before upload.
 * Skips GIFs, tiny files, and non-images. Falls back to the original on failure.
 */
export async function compressImageFile(file: File): Promise<File> {
  if (!shouldCompressImage(file)) {
    return file;
  }

  try {
    const image = await loadImage(file);
    const scale = Math.min(
      1,
      IMAGE_COMPRESS_MAX_EDGE / Math.max(image.width, image.height),
    );
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);

    const compressed = await canvasToJpegFile(
      canvas,
      compressedImageName(file.name),
      IMAGE_COMPRESS_QUALITY,
    );

    // Keep the original when compression did not shrink the payload.
    return compressed.size < file.size ? compressed : file;
  } catch {
    return file;
  }
}
