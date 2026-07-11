"use client";

import { Camera, Video } from "lucide-react";
import { useId, useRef, type ChangeEvent } from "react";

import { Button } from "@/components/ui/Button";
import {
  NATIVE_PHOTO_CAPTURE_ACCEPT,
  NATIVE_VIDEO_CAPTURE_ACCEPT,
} from "@/lib/moments/camera-capture";

type NativeMediaCaptureProps = {
  onCaptured: (file: File) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

export function NativeMediaCapture({
  onCaptured,
  onError,
  disabled = false,
}: NativeMediaCaptureProps) {
  const baseId = useId();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  function handleCapture(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size === 0) {
      onError("That capture was empty. Try again.");
      event.target.value = "";
      return;
    }

    onCaptured(file);
    event.target.value = "";
  }

  return (
    <div className="rounded-xl border border-border bg-accent-subtle/30 p-4">
      <p className="text-sm font-medium text-ink">Or use your camera</p>
      <p className="mt-1 text-xs text-muted">
        Opens your phone&apos;s camera app for photos or video.
      </p>

      <input
        ref={photoInputRef}
        id={`${baseId}-photo`}
        type="file"
        accept={NATIVE_PHOTO_CAPTURE_ACCEPT}
        capture="environment"
        aria-label="Take photo with phone camera"
        className="sr-only"
        disabled={disabled}
        onChange={handleCapture}
      />
      <input
        ref={videoInputRef}
        id={`${baseId}-video`}
        type="file"
        accept={NATIVE_VIDEO_CAPTURE_ACCEPT}
        capture="environment"
        aria-label="Record video with phone camera"
        className="sr-only"
        disabled={disabled}
        onChange={handleCapture}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => photoInputRef.current?.click()}
        >
          <Camera className="h-4 w-4" aria-hidden />
          Take photo
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => videoInputRef.current?.click()}
        >
          <Video className="h-4 w-4" aria-hidden />
          Record video
        </Button>
      </div>
    </div>
  );
}
