"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";

import { PhotoCapture } from "@/components/capture/PhotoCapture";
import { VoiceMemoRecorder } from "@/components/capture/VoiceMemoRecorder";
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
      source: "file" | "voice" | "camera";
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
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const mediaBusy =
    isRecording || isCameraActive || prepareState.status === "compressing";

  function setIdle() {
    setPrepareState({ status: "idle" });
    onValidityChange?.(true);
  }

  function setError(message: string) {
    setPrepareState({ status: "error", message });
    onValidityChange?.(true);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function assignFileToInput(file: File) {
    if (!inputRef.current) {
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(file);
    inputRef.current.files = transfer.files;
  }

  function markReady(
    file: File,
    options: {
      originalBytes: number;
      compressed: boolean;
      source: "file" | "voice" | "camera";
    },
  ) {
    setPrepareState({
      status: "ready",
      fileName: file.name,
      originalBytes: options.originalBytes,
      finalBytes: file.size,
      compressed: options.compressed,
      source: options.source,
    });
    onValidityChange?.(true);
  }

  async function attachMediaFile(
    file: File,
    source: "file" | "voice" | "camera",
  ) {
    const validationError = validateMediaFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const shouldPrepareImage =
      source === "camera" || (source === "file" && shouldCompressImage(file));

    if (shouldPrepareImage) {
      setPrepareState({ status: "compressing", fileName: file.name });
      onValidityChange?.(false);

      try {
        const prepared = await compressImageFile(file);
        const preparedError = validateMediaFile(prepared);

        if (preparedError) {
          setError(preparedError);
          return;
        }

        assignFileToInput(prepared);
        markReady(prepared, {
          originalBytes: file.size,
          compressed: prepared.size < file.size,
          source,
        });
      } catch {
        setError("Could not prepare that photo. Try another file.");
      }

      return;
    }

    assignFileToInput(file);
    markReady(file, {
      originalBytes: file.size,
      compressed: false,
      source,
    });
  }

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      setIdle();
      return;
    }

    await attachMediaFile(file, "file");
  }

  function handleVoiceRecorded(file: File) {
    void attachMediaFile(file, "voice");
  }

  function handlePhotoCaptured(file: File) {
    void attachMediaFile(file, "camera");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          Photo, video, or audio{" "}
          <span className="font-normal text-muted">(optional)</span>
        </label>

        {currentFilename ? (
          <p className="text-sm text-muted">
            Current file:{" "}
            <span className="font-medium text-ink">{currentFilename}</span>
          </p>
        ) : null}

        <input
          ref={inputRef}
          id={inputId}
          name="media"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg"
          onChange={handleChange}
          disabled={mediaBusy}
          className="block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-accent-subtle file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <p className="text-xs text-muted">
          Max 10 MB photos, 50 MB video, 25 MB audio. Large photos are
          compressed before upload.
        </p>
      </div>

      <PhotoCapture
        disabled={mediaBusy}
        onCameraActiveChange={(active) => {
          setIsCameraActive(active);
          onValidityChange?.(!active && !isRecording);
        }}
        onCaptured={handlePhotoCaptured}
        onError={setError}
      />

      <VoiceMemoRecorder
        disabled={mediaBusy}
        onRecordingChange={(recording) => {
          setIsRecording(recording);
          onValidityChange?.(!recording && !isCameraActive);
        }}
        onRecorded={handleVoiceRecorded}
        onError={setError}
      />

      {prepareState.status === "compressing" ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-border">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
          </div>
          <p className="text-sm text-muted">
            Preparing {prepareState.fileName}…
          </p>
        </div>
      ) : null}

      {prepareState.status === "ready" && prepareState.compressed ? (
        <p className="text-sm text-muted">
          Compressed {prepareState.fileName}:{" "}
          {formatFileSize(prepareState.originalBytes)} →{" "}
          {formatFileSize(prepareState.finalBytes)}
        </p>
      ) : null}

      {prepareState.status === "ready" && !prepareState.compressed ? (
        <p className="text-sm text-muted">
          Ready: {prepareState.fileName} (
          {formatFileSize(prepareState.finalBytes)})
          {prepareState.source === "voice"
            ? " · voice memo"
            : prepareState.source === "camera"
              ? " · camera"
              : ""}
        </p>
      ) : null}

      {prepareState.status === "error" ? (
        <p className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger">
          {prepareState.message}
        </p>
      ) : null}

      {showRemove && currentFilename ? (
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            name="remove_media"
            className="rounded border-border-strong accent-accent"
          />
          Remove current attachment
        </label>
      ) : null}
    </div>
  );
}
