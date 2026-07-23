"use client";

import { RotateCcw, Upload, X } from "lucide-react";
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

export type ExistingMediaInput = {
  id: string;
  media_type: MediaType;
  original_filename: string | null;
};

type MediaFileInputProps = {
  id?: string;
  existingMedia?: ExistingMediaInput[];
  onValidityChange?: (isValid: boolean) => void;
  onPreparedFilesChange: (files: File[]) => void;
};

type PreparedMedia = {
  id: string;
  file: File;
  url: string;
  type: MediaType;
  originalBytes: number;
  compressed: boolean;
  source: "file" | "voice" | "camera";
};

export function MediaFileInput({
  id,
  existingMedia = [],
  onValidityChange,
  onPreparedFilesChange,
}: MediaFileInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const [preparedMedia, setPreparedMedia] = useState<PreparedMedia[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [preparingName, setPreparingName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const activeExistingCount =
    existingMedia.length -
    existingMedia.filter((media) => removedIds.has(media.id)).length;
  const totalCount = activeExistingCount + preparedMedia.length;
  const mediaBusy = isRecording || isCameraActive || Boolean(preparingName);

  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function commitPrepared(next: PreparedMedia[]) {
    setPreparedMedia(next);
    onPreparedFilesChange(next.map((item) => item.file));
  }

  function removePrepared(id: string) {
    const item = preparedMedia.find((media) => media.id === id);
    if (item) {
      URL.revokeObjectURL(item.url);
      previewUrlsRef.current.delete(item.url);
    }
    commitPrepared(preparedMedia.filter((media) => media.id !== id));
    setError(null);
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
      commitPrepared(next);
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

      {existingMedia.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Already kept
          </p>
          {existingMedia.map((media) => {
            const removed = removedIds.has(media.id);
            return (
              <div
                key={media.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2"
              >
                <span
                  className={
                    removed
                      ? "text-sm text-muted line-through"
                      : "text-sm text-ink"
                  }
                >
                  {media.original_filename ?? `${media.media_type} attachment`}
                </span>
                {removed ? (
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
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm font-medium text-danger"
                    onClick={() => {
                      setRemovedIds(new Set(removedIds).add(media.id));
                      setError(null);
                    }}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                    Remove
                  </button>
                )}
              </div>
            );
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

      {preparedMedia.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {preparedMedia.map((media) => (
            <li
              key={media.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface"
            >
              {media.type === "photo" ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL
                <img
                  src={media.url}
                  alt={`Preview of ${media.file.name}`}
                  className="aspect-video w-full bg-accent-subtle object-contain"
                />
              ) : media.type === "video" ? (
                <video
                  controls
                  src={media.url}
                  className="aspect-video w-full bg-black object-contain"
                >
                  Your browser does not support video previews.
                </video>
              ) : (
                <div className="p-4">
                  <audio controls src={media.url} className="w-full">
                    Your browser does not support audio previews.
                  </audio>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
                <p className="min-w-0 truncate text-xs text-muted">
                  {media.file.name} · {formatFileSize(media.file.size)}
                  {media.compressed
                    ? ` (from ${formatFileSize(media.originalBytes)})`
                    : ""}
                </p>
                <button
                  type="button"
                  className="shrink-0 text-sm font-medium text-danger"
                  onClick={() => removePrepared(media.id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
