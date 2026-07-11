"use client";

import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/Button";
import {
  capturePhotoFromVideo,
  isCameraSupported,
  openCameraStream,
} from "@/lib/moments/camera-capture";

type PhotoCaptureProps = {
  onCameraActiveChange: (isActive: boolean) => void;
  onCaptured: (file: File) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

type CaptureState =
  | { status: "idle" }
  | { status: "preview" }
  | { status: "capturing" };

function subscribeToCameraSupport() {
  return () => {};
}

export function PhotoCapture({
  onCameraActiveChange,
  onCaptured,
  onError,
  disabled = false,
}: PhotoCaptureProps) {
  const [state, setState] = useState<CaptureState>({ status: "idle" });
  const supported = useSyncExternalStore(
    subscribeToCameraSupport,
    isCameraSupported,
    () => false,
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  useEffect(() => {
    if (state.status !== "preview") {
      return;
    }

    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream) {
      return;
    }

    video.srcObject = stream;

    void video.play().catch(() => {
      onError("Could not start the camera preview.");
      stopStream();
      setState({ status: "idle" });
      onCameraActiveChange(false);
    });
  }, [state.status, onError, onCameraActiveChange]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function closeCamera() {
    stopStream();
    setState({ status: "idle" });
    onCameraActiveChange(false);
  }

  async function openCamera() {
    if (disabled || state.status === "preview") {
      return;
    }

    try {
      const stream = await openCameraStream();
      streamRef.current = stream;
      setState({ status: "preview" });
      onCameraActiveChange(true);
    } catch {
      onError(
        "Camera access was denied. Allow camera permission or upload a photo instead.",
      );
    }
  }

  async function takePhoto() {
    if (state.status !== "preview" || !videoRef.current) {
      return;
    }

    setState({ status: "capturing" });

    try {
      const file = await capturePhotoFromVideo(videoRef.current);
      closeCamera();
      onCaptured(file);
    } catch (error) {
      setState({ status: "preview" });
      onError(
        error instanceof Error
          ? error.message
          : "Could not capture that photo. Try again.",
      );
    }
  }

  if (!supported) {
    return null;
  }

  const isPreview = state.status === "preview" || state.status === "capturing";

  return (
    <div className="rounded-xl border border-border bg-accent-subtle/30 p-4">
      <p className="text-sm font-medium text-ink">Or take a photo</p>
      <p className="mt-1 text-xs text-muted">Snap one right here.</p>

      {!isPreview ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => void openCamera()}
          >
            <Camera className="h-4 w-4" aria-hidden />
            Open camera
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="overflow-hidden rounded-xl border border-border bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="aspect-[4/3] w-full object-cover"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              size="sm"
              disabled={state.status === "capturing"}
              onClick={() => void takePhoto()}
            >
              <Camera className="h-4 w-4" aria-hidden />
              {state.status === "capturing" ? "Capturing…" : "Capture photo"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={state.status === "capturing"}
              onClick={closeCamera}
            >
              <X className="h-4 w-4" aria-hidden />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
