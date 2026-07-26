"use client";

import {
  ArrowDown,
  ArrowUp,
  FileAudio,
  ImageIcon,
  RotateCcw,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";

import { MediaCapture } from "@/components/capture/MediaCapture";
import { VoiceMemoRecorder } from "@/components/capture/VoiceMemoRecorder";
import type { MediaType } from "@/lib/database.types";
import {
  compressImageFile,
  formatFileSize,
  shouldCompressImage,
} from "@/lib/moments/compress-image";
import { cn } from "@/lib/cn";
import {
  getMediaTypeFromFile,
  MAX_MEDIA_ATTACHMENTS,
  normalizeMediaFileType,
  validateMediaFile,
  validateMediaFiles,
} from "@/lib/moments/media";
import { createVideoPosterFile } from "@/lib/moments/video-poster";

export type ExistingMediaInput = {
  id: string;
  media_type: MediaType;
  original_filename: string | null;
  signedUrl?: string;
};

type MediaFileInputProps = {
  id?: string;
  existingMedia?: ExistingMediaInput[];
  onValidityChange?: (isValid: boolean) => void;
  onPreparedFilesChange: (files: File[]) => void;
  onPreparedThumbnailsChange?: (thumbnails: (File | null)[]) => void;
};

type PreparedMedia = {
  id: string;
  file: File;
  url: string;
  type: MediaType;
  originalBytes: number;
  compressed: boolean;
  source: "file" | "voice" | "camera";
  thumbnail: File | null;
};

type OrderedMediaItem =
  | {
      key: string;
      kind: "existing";
      media: ExistingMediaInput;
    }
  | {
      key: string;
      kind: "prepared";
      media: PreparedMedia;
    };

function existingMediaKey(id: string): string {
  return `existing:${id}`;
}

function preparedMediaKey(id: string): string {
  return `prepared:${id}`;
}

export function MediaFileInput({
  id,
  existingMedia = [],
  onValidityChange,
  onPreparedFilesChange,
  onPreparedThumbnailsChange,
}: MediaFileInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const [preparedMedia, setPreparedMedia] = useState<PreparedMedia[]>([]);
  const [mediaOrder, setMediaOrder] = useState<string[]>(() =>
    existingMedia.map((media) => existingMediaKey(media.id)),
  );
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [preparingName, setPreparingName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const existingByKey = new Map(
    existingMedia.map((media) => [existingMediaKey(media.id), media]),
  );
  const preparedByKey = new Map(
    preparedMedia.map((media) => [preparedMediaKey(media.id), media]),
  );
  const orderedMedia = mediaOrder.flatMap<OrderedMediaItem>((key) => {
    const existing = existingByKey.get(key);
    if (existing && !removedIds.has(existing.id)) {
      return [{ key, kind: "existing", media: existing }];
    }

    const prepared = preparedByKey.get(key);
    return prepared ? [{ key, kind: "prepared", media: prepared }] : [];
  });
  const visualMedia = orderedMedia.filter((item) => {
    const type =
      item.kind === "existing" ? item.media.media_type : item.media.type;
    return type === "photo" || type === "video";
  });
  const audioMedia = orderedMedia.filter((item) => {
    const type =
      item.kind === "existing" ? item.media.media_type : item.media.type;
    return type === "audio";
  });
  const activeExistingCount = orderedMedia.filter(
    (item) => item.kind === "existing",
  ).length;
  const totalCount = orderedMedia.length;
  const coverKey = orderedMedia.find((item) => {
    const type =
      item.kind === "existing" ? item.media.media_type : item.media.type;
    return type === "photo" || type === "video";
  })?.key;
  const mediaBusy = isRecording || isCameraActive || Boolean(preparingName);

  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function filesForOrder(nextOrder: string[], nextMedia: PreparedMedia[]) {
    const nextByKey = new Map(
      nextMedia.map((media) => [preparedMediaKey(media.id), media]),
    );
    return nextOrder.flatMap((key) => {
      const media = nextByKey.get(key);
      return media ? [media.file] : [];
    });
  }

  function thumbnailsForOrder(nextOrder: string[], nextMedia: PreparedMedia[]) {
    const nextByKey = new Map(
      nextMedia.map((media) => [preparedMediaKey(media.id), media]),
    );
    return nextOrder.flatMap((key) => {
      const media = nextByKey.get(key);
      return media ? [media.thumbnail] : [];
    });
  }

  function notifyPrepared(nextOrder: string[], nextMedia: PreparedMedia[]) {
    onPreparedFilesChange(filesForOrder(nextOrder, nextMedia));
    onPreparedThumbnailsChange?.(thumbnailsForOrder(nextOrder, nextMedia));
  }

  function commitPrepared(
    next: PreparedMedia[],
    nextOrder: string[] = mediaOrder,
  ) {
    setPreparedMedia(next);
    setMediaOrder(nextOrder);
    notifyPrepared(nextOrder, next);
  }

  function removePrepared(id: string) {
    const item = preparedMedia.find((media) => media.id === id);
    if (item) {
      URL.revokeObjectURL(item.url);
      previewUrlsRef.current.delete(item.url);
    }
    const nextMedia = preparedMedia.filter((media) => media.id !== id);
    const nextOrder = mediaOrder.filter((key) => key !== preparedMediaKey(id));
    commitPrepared(nextMedia, nextOrder);
    setError(null);
  }

  function moveVisualMedia(key: string, direction: -1 | 1) {
    const visualKeys = visualMedia.map((item) => item.key);
    const currentIndex = visualKeys.indexOf(key);
    const targetKey = visualKeys[currentIndex + direction];

    if (currentIndex < 0 || !targetKey) {
      return;
    }

    const nextOrder = [...mediaOrder];
    const keyIndex = nextOrder.indexOf(key);
    const targetIndex = nextOrder.indexOf(targetKey);
    [nextOrder[keyIndex], nextOrder[targetIndex]] = [
      nextOrder[targetIndex],
      nextOrder[keyIndex],
    ];
    setMediaOrder(nextOrder);
    notifyPrepared(nextOrder, preparedMedia);
  }

  async function prepareFiles(files: File[], source: PreparedMedia["source"]) {
    if (files.length === 0) {
      return;
    }

    const available = MAX_MEDIA_ATTACHMENTS - totalCount;
    if (available <= 0 || files.length > available) {
      setError(`Keep up to ${MAX_MEDIA_ATTACHMENTS} attachments per moment.`);
      return;
    }

    const normalizedFiles = files.map(normalizeMediaFileType);
    const initialError = normalizedFiles
      .map(validateMediaFile)
      .find((message): message is string => Boolean(message));
    if (initialError) {
      setError(initialError);
      return;
    }

    setError(null);
    onValidityChange?.(false);
    const nextItems: PreparedMedia[] = [];

    try {
      for (const file of normalizedFiles) {
        const validationError = validateMediaFile(file);
        if (validationError) {
          throw new Error(validationError);
        }

        setPreparingName(file.name);
        const shouldPrepareImage =
          getMediaTypeFromFile(file) === "photo" &&
          (source === "camera" ||
            (source === "file" && shouldCompressImage(file)));
        const prepared = shouldPrepareImage
          ? await compressImageFile(file)
          : file;
        const preparedError = validateMediaFile(prepared);
        const mediaType = getMediaTypeFromFile(prepared);

        if (preparedError || !mediaType) {
          throw new Error(preparedError ?? "Unsupported media type.");
        }

        const thumbnail =
          mediaType === "video" && onPreparedThumbnailsChange
            ? await createVideoPosterFile(prepared)
            : null;
        const url = URL.createObjectURL(prepared);
        previewUrlsRef.current.add(url);
        nextItems.push({
          id: crypto.randomUUID(),
          file: prepared,
          url,
          type: mediaType,
          originalBytes: file.size,
          compressed: prepared.size < file.size,
          source,
          thumbnail,
        });
      }

      const next = [...preparedMedia, ...nextItems];
      const combinedError = validateMediaFiles(
        next.map((item) => item.file),
        activeExistingCount,
      );
      if (combinedError) {
        throw new Error(combinedError);
      }
      const nextOrder = [
        ...mediaOrder,
        ...nextItems.map((item) => preparedMediaKey(item.id)),
      ];
      commitPrepared(next, nextOrder);
    } catch (prepareError) {
      nextItems.forEach((item) => {
        URL.revokeObjectURL(item.url);
        previewUrlsRef.current.delete(item.url);
      });
      setError(
        prepareError instanceof Error
          ? prepareError.message
          : "Could not prepare that media.",
      );
    } finally {
      setPreparingName(null);
      onValidityChange?.(true);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    void prepareFiles(Array.from(event.currentTarget.files ?? []), "file");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink">
            Photos, videos, or voice{" "}
            <span className="font-normal text-muted">(optional)</span>
          </p>
          <span className="text-xs font-medium text-muted">
            {totalCount}/{MAX_MEDIA_ATTACHMENTS}
          </span>
        </div>

        <label
          htmlFor={inputId}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-accent-subtle/35 px-4 py-8 text-center transition hover:border-accent/50 hover:bg-accent-subtle/60 focus-within:ring-2 focus-within:ring-accent/20",
            (mediaBusy || totalCount >= MAX_MEDIA_ATTACHMENTS) &&
              "pointer-events-none opacity-60",
          )}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-accent shadow-sm">
            <Upload className="h-5 w-5" aria-hidden />
          </span>
          <span className="mt-3 text-sm font-medium text-ink">
            Add from your device
          </span>
          <span className="mt-1 max-w-xs text-xs leading-relaxed text-muted">
            Photos, videos, or voice files. Up to five attachments and 50 MB
            combined.
          </span>
          <input
            ref={inputRef}
            id={inputId}
            name="media"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg"
            onChange={handleChange}
            disabled={mediaBusy || totalCount >= MAX_MEDIA_ATTACHMENTS}
            className="sr-only"
          />
        </label>
      </div>

      <MediaCapture
        disabled={mediaBusy || totalCount >= MAX_MEDIA_ATTACHMENTS}
        onCameraActiveChange={(active) => {
          setIsCameraActive(active);
          onValidityChange?.(!active && !isRecording && !preparingName);
        }}
        onCaptured={(file) => void prepareFiles([file], "camera")}
        onError={setError}
      />

      <VoiceMemoRecorder
        disabled={mediaBusy || totalCount >= MAX_MEDIA_ATTACHMENTS}
        onRecordingChange={(recording) => {
          setIsRecording(recording);
          onValidityChange?.(!recording && !isCameraActive && !preparingName);
        }}
        onRecorded={(file) => void prepareFiles([file], "voice")}
        onError={setError}
      />

      {preparingName ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-border">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
          </div>
          <p className="text-sm text-muted">Getting {preparingName} ready…</p>
        </div>
      ) : null}

      {visualMedia.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Photo and video order
          </p>
          <ul className="space-y-2">
            {visualMedia.map((item, index) => {
              const mediaType =
                item.kind === "existing"
                  ? item.media.media_type
                  : item.media.type;
              const filename =
                item.kind === "existing"
                  ? (item.media.original_filename ?? `${mediaType} attachment`)
                  : item.media.file.name;
              const previewUrl =
                item.kind === "existing"
                  ? item.media.signedUrl
                  : item.media.url;

              return (
                <li
                  key={item.key}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent-subtle text-accent">
                    {previewUrl && mediaType === "photo" ? (
                      // eslint-disable-next-line @next/next/no-img-element -- signed or local preview URL
                      <img
                        src={previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : previewUrl && mediaType === "video" ? (
                      <video
                        src={previewUrl}
                        muted
                        playsInline
                        preload="metadata"
                        aria-hidden="true"
                        className="h-full w-full object-cover"
                      />
                    ) : mediaType === "photo" ? (
                      <ImageIcon className="h-5 w-5" aria-hidden />
                    ) : (
                      <Video className="h-5 w-5" aria-hidden />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {filename}
                    </p>
                    <p className="text-xs text-muted">
                      {item.key === coverKey ? "Cover · " : ""}
                      {mediaType}
                      {item.kind === "prepared"
                        ? ` · ${formatFileSize(item.media.file.size)}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Move ${filename} earlier`}
                      title="Move earlier"
                      disabled={index === 0}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-accent-subtle hover:text-accent disabled:opacity-30"
                      onClick={() => moveVisualMedia(item.key, -1)}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${filename} later`}
                      title="Move later"
                      disabled={index === visualMedia.length - 1}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-accent-subtle hover:text-accent disabled:opacity-30"
                      onClick={() => moveVisualMedia(item.key, 1)}
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${filename}`}
                      title="Remove"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-danger transition hover:bg-danger-subtle"
                      onClick={() => {
                        if (item.kind === "existing") {
                          setRemovedIds(new Set(removedIds).add(item.media.id));
                          setError(null);
                        } else {
                          removePrepared(item.media.id);
                        }
                      }}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {audioMedia.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Voice attachments
          </p>
          <ul className="space-y-2">
            {audioMedia.map((item) => {
              const filename =
                item.kind === "existing"
                  ? (item.media.original_filename ?? "Voice memo")
                  : item.media.file.name;

              return (
                <li
                  key={item.key}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent">
                    <FileAudio className="h-5 w-5" aria-hidden />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {filename}
                    </p>
                    <p className="text-xs text-muted">
                      Voice memo
                      {item.kind === "prepared"
                        ? ` · ${formatFileSize(item.media.file.size)}`
                        : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label={`Remove ${filename}`}
                    title="Remove"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-danger transition hover:bg-danger-subtle"
                    onClick={() => {
                      if (item.kind === "existing") {
                        setRemovedIds(new Set(removedIds).add(item.media.id));
                        setError(null);
                      } else {
                        removePrepared(item.media.id);
                      }
                    }}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {orderedMedia.map((item, index) => (
        <input
          key={`order:${item.key}`}
          type="hidden"
          name="media_order"
          value={
            item.kind === "existing"
              ? `existing:${item.media.id}`
              : `new:${
                  orderedMedia
                    .slice(0, index + 1)
                    .filter((ordered) => ordered.kind === "prepared").length - 1
                }`
          }
        />
      ))}

      {removedIds.size > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Removed
          </p>
          {[...removedIds].flatMap((mediaId) => {
            const media = existingMedia.find((item) => item.id === mediaId);
            if (!media) {
              return [];
            }

            const filename =
              media.original_filename ?? `${media.media_type} attachment`;

            return [
              <div
                key={media.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2"
              >
                <span className="truncate text-sm text-muted line-through">
                  {filename}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-medium text-accent"
                  onClick={() => {
                    if (totalCount >= MAX_MEDIA_ATTACHMENTS) {
                      setError(
                        `Keep up to ${MAX_MEDIA_ATTACHMENTS} attachments per moment.`,
                      );
                      return;
                    }
                    const next = new Set(removedIds);
                    next.delete(media.id);
                    setRemovedIds(next);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  Undo
                </button>
              </div>,
            ];
          })}
          {[...removedIds].map((mediaId) => (
            <input
              key={mediaId}
              type="hidden"
              name="remove_media_id"
              value={mediaId}
            />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
