export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type UploadJsonResult = {
  redirectTo?: string;
  error?: string;
};

export class UploadRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UploadRequestError";
    this.status = status;
  }
}

export function uploadProgressPercent(loaded: number, total: number): number {
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((loaded / total) * 100)));
}

export type PostFormDataWithProgressOptions = {
  onProgress?: (progress: UploadProgress) => void;
  /** Fires when bytes finished leaving the browser; server may still be saving. */
  onUploadComplete?: () => void;
};

/**
 * POST FormData with real upload progress via XHR.
 * fetch() does not expose upload progress events.
 *
 * Note: percent reaches 100 when the request body has left the browser.
 * On localhost that can be nearly instant; remaining wait is server-side
 * (DB + Supabase Storage), which is not measurable from XHR upload events.
 */
export function postFormDataWithProgress(
  url: string,
  formData: FormData,
  options: PostFormDataWithProgressOptions = {},
): Promise<UploadJsonResult> {
  const { onProgress, onUploadComplete } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (!onProgress) {
        return;
      }

      const total = event.lengthComputable ? event.total : 0;
      const loaded = event.loaded;
      onProgress({
        loaded,
        total,
        percent: uploadProgressPercent(loaded, total),
      });
    };

    xhr.upload.onload = () => {
      onProgress?.({ loaded: 1, total: 1, percent: 100 });
      onUploadComplete?.();
    };

    xhr.onload = () => {
      const payload =
        typeof xhr.response === "object" && xhr.response !== null
          ? (xhr.response as UploadJsonResult)
          : {};

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload);
        return;
      }

      reject(
        new UploadRequestError(
          payload.error || "Could not save your moment.",
          xhr.status,
        ),
      );
    };

    xhr.onerror = () => {
      reject(new UploadRequestError("Could not reach the server.", 0));
    };

    xhr.onabort = () => {
      reject(new UploadRequestError("Upload was cancelled.", 0));
    };

    xhr.send(formData);
  });
}
