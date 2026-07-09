"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";

import {
  compressImageFile,
  formatFileSize,
  shouldCompressImage,
} from "@/lib/moments/compress-image";
import { validateMediaFile } from "@/lib/moments/media";

type MediaFileInputProps = {
  id?: string;
  currentFilename?: string | null;
  showRemove?: boolean;
  onValidityChange?: (isValid: boolean) => void;
};

type PrepareState =
  | { status: "idle" }
  | { status: "compressing"; fileName: string }
  | {
      status: "ready";
      fileName: string;
      originalBytes: number;
      finalBytes: number;
      compressed: boolean;
    }
  | { status: "error"; message: string };

export function MediaFileInput({
  id,
  currentFilename,
  showRemove = false,
  onValidityChange,
}: MediaFileInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [prepareState, setPrepareState] = useState<PrepareState>({
    status: "idle",
  });

  function setIdle() {
    setPrepareState({ status: "idle" });
    onValidityChange?.(true);
  }

  function setError(message: string) {
    setPrepareState({ status: "error", message });
    // Cleared input means no media will upload — form can still save text-only.
    onValidityChange?.(true);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      setIdle();
      return;
    }

    const validationError = validateMediaFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!shouldCompressImage(file)) {
      setPrepareState({
        status: "ready",
        fileName: file.name,
        originalBytes: file.size,
        finalBytes: file.size,
        compressed: false,
      });
      onValidityChange?.(true);
      return;
    }

    setPrepareState({ status: "compressing", fileName: file.name });
    onValidityChange?.(false);

    try {
      const prepared = await compressImageFile(file);
      const preparedError = validateMediaFile(prepared);

      if (preparedError) {
        setError(preparedError);
        return;
      }

      const transfer = new DataTransfer();
      transfer.items.add(prepared);
      input.files = transfer.files;

      setPrepareState({
        status: "ready",
        fileName: prepared.name,
        originalBytes: file.size,
        finalBytes: prepared.size,
        compressed: prepared.size < file.size,
      });
      onValidityChange?.(true);
    } catch {
      setError("Could not prepare that photo. Try another file.");
    }
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
      >
        Photo, video, or audio{" "}
        <span className="font-normal text-zinc-500">(optional)</span>
      </label>

      {currentFilename ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Current file: <span className="font-medium">{currentFilename}</span>
        </p>
      ) : null}

      <input
        ref={inputRef}
        id={inputId}
        name="media"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg"
        onChange={handleChange}
        className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-200 dark:text-zinc-300 dark:file:bg-zinc-800 dark:file:text-zinc-100 dark:hover:file:bg-zinc-700"
      />

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Max 10 MB photos, 50 MB video, 25 MB audio. Large photos are compressed
        before upload.
      </p>

      {prepareState.status === "compressing" ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-zinc-900 dark:bg-zinc-100" />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Preparing {prepareState.fileName}…
          </p>
        </div>
      ) : null}

      {prepareState.status === "ready" && prepareState.compressed ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Compressed {prepareState.fileName}:{" "}
          {formatFileSize(prepareState.originalBytes)} →{" "}
          {formatFileSize(prepareState.finalBytes)}
        </p>
      ) : null}

      {prepareState.status === "ready" && !prepareState.compressed ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ready: {prepareState.fileName} (
          {formatFileSize(prepareState.finalBytes)})
        </p>
      ) : null}

      {prepareState.status === "error" ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {prepareState.message}
        </p>
      ) : null}

      {showRemove && currentFilename ? (
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            name="remove_media"
            className="rounded border-zinc-300 dark:border-zinc-700"
          />
          Remove current attachment
        </label>
      ) : null}
    </div>
  );
}
