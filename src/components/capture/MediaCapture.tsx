"use client";

import { Camera, Square, SwitchCamera, Video, X, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { NativeMediaCapture } from "@/components/capture/NativeMediaCapture";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  applyCameraZoom,
  buildCameraVideoFile,
  capturePhotoFromVideo,
  clampZoom,
  formatRecordingDuration,
  formatZoomLabel,
  getSupportedCameraVideoMimeType,
  getVideoTrack,
  getZoomCapabilities,
  isCameraSupported,
  isVideoCaptureSupported,
  MAX_CAMERA_VIDEO_MS,
  openCameraStream,
  prefersNativeCamera,
  toggleFacingMode,
  type CameraFacingMode,
  type ZoomCapabilities,
} from "@/lib/moments/camera-capture";

type MediaCaptureProps = {
  onCameraActiveChange: (isActive: boolean) => void;
  onCaptured: (file: File) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

type CaptureMode = "photo" | "video";

type CaptureState =
  | { status: "idle" }
  | { status: "preview" }
  | { status: "capturing" }
  | { status: "recording"; startedAt: number }
  | { status: "processing" };

function subscribeToCameraSupport() {
  return () => {};
}

export function MediaCapture(props: MediaCaptureProps) {
  const useNative = useSyncExternalStore(
    subscribeToCameraSupport,
    prefersNativeCamera,
    () => false,
  );

  if (useNative) {
    return (
      <NativeMediaCapture
        disabled={props.disabled}
        onCaptured={props.onCaptured}
        onError={props.onError}
      />
    );
  }

  return <BrowserMediaCapture {...props} />;
}

function BrowserMediaCapture({
  onCameraActiveChange,
  onCaptured,
  onError,
  disabled = false,
}: MediaCaptureProps) {
  const [state, setState] = useState<CaptureState>({ status: "idle" });
  const [mode, setMode] = useState<CaptureMode>("photo");
  const [facingMode, setFacingMode] = useState<CameraFacingMode>("environment");
  const [streamVersion, setStreamVersion] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [zoomCapabilities, setZoomCapabilities] = useState<ZoomCapabilities>({
    min: 1,
    max: 3,
    step: 0.1,
    hardware: false,
  });
  const [elapsedMs, setElapsedMs] = useState(0);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const supported = useSyncExternalStore(
    subscribeToCameraSupport,
    isCameraSupported,
    () => false,
  );
  const videoSupported = useSyncExternalStore(
    subscribeToCameraSupport,
    isVideoCaptureSupported,
    () => false,
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("video/webm");
  const pinchDistanceRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  useEffect(() => {
    if (state.status !== "preview" && state.status !== "recording") {
      return;
    }

    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream) {
      return;
    }

    video.srcObject = stream;

    const playResult = video.play();
    if (playResult) {
      void playResult.catch(() => {
        onError("Could not start the camera preview.");
        stopStream();
        setState({ status: "idle" });
        setElapsedMs(0);
        onCameraActiveChange(false);
      });
    }
  }, [state.status, streamVersion, onError, onCameraActiveChange]);

  useEffect(() => {
    if (state.status !== "recording") {
      return;
    }

    const intervalId = window.setInterval(() => {
      const nextElapsed = Date.now() - state.startedAt;
      setElapsedMs(nextElapsed);

      if (
        nextElapsed >= MAX_CAMERA_VIDEO_MS &&
        mediaRecorderRef.current?.state === "recording"
      ) {
        stopVideoRecording();
      }
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [state]);

  useEffect(() => {
    const isOpen =
      state.status === "preview" ||
      state.status === "capturing" ||
      state.status === "recording" ||
      state.status === "processing";

    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [state.status]);

  function stopStream() {
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function closeCamera() {
    stopStream();
    setState({ status: "idle" });
    setElapsedMs(0);
    setZoom(1);
    onCameraActiveChange(false);
  }

  async function bindStream(stream: MediaStream) {
    streamRef.current = stream;
    const track = getVideoTrack(stream);
    const capabilities = getZoomCapabilities(track);
    setZoomCapabilities(capabilities);
    setZoom(capabilities.min);
    setStreamVersion((current) => current + 1);

    if (capabilities.hardware && track) {
      try {
        await applyCameraZoom(track, capabilities.min, capabilities);
      } catch {
        // Hardware zoom is optional; visual zoom still works.
      }
    }
  }

  async function openCamera(nextMode: CaptureMode = mode) {
    if (disabled || state.status !== "idle") {
      return;
    }

    try {
      const stream = await openCameraStream(
        facingMode,
        nextMode === "video" && videoSupported,
      );
      await bindStream(stream);
      setMode(nextMode);
      setState({ status: "preview" });
      onCameraActiveChange(true);
    } catch {
      onError(
        "Camera access was denied. Allow camera permission or upload media instead.",
      );
    }
  }

  async function switchCamera() {
    if (
      disabled ||
      state.status === "capturing" ||
      state.status === "recording" ||
      state.status === "processing"
    ) {
      return;
    }

    const nextFacing = toggleFacingMode(facingMode);

    try {
      stopStream();
      const stream = await openCameraStream(
        nextFacing,
        mode === "video" && videoSupported,
      );
      await bindStream(stream);
      setFacingMode(nextFacing);
      setState({ status: "preview" });
    } catch {
      onError("Could not switch cameras. Try again.");
      closeCamera();
    }
  }

  async function updateZoom(nextZoom: number) {
    const clamped = clampZoom(nextZoom, zoomCapabilities);
    setZoom(clamped);

    if (zoomCapabilities.hardware) {
      const track = getVideoTrack(streamRef.current);
      if (track) {
        try {
          await applyCameraZoom(track, clamped, zoomCapabilities);
        } catch {
          onError("Could not adjust zoom on this device.");
        }
      }
    }
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 2) {
      pinchDistanceRef.current = null;
      return;
    }

    const [first, second] = Array.from(event.touches);
    pinchDistanceRef.current = Math.hypot(
      second.clientX - first.clientX,
      second.clientY - first.clientY,
    );
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 2 || pinchDistanceRef.current === null) {
      return;
    }

    const [first, second] = Array.from(event.touches);
    const distance = Math.hypot(
      second.clientX - first.clientX,
      second.clientY - first.clientY,
    );
    const delta = distance - pinchDistanceRef.current;

    if (Math.abs(delta) > 6) {
      void updateZoom(zoom + delta * 0.004);
      pinchDistanceRef.current = distance;
    }
  }

  async function takePhoto() {
    if (state.status !== "preview" || !videoRef.current) {
      return;
    }

    setState({ status: "capturing" });

    try {
      const file = await capturePhotoFromVideo(
        videoRef.current,
        zoomCapabilities.hardware ? 1 : zoom,
      );
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

  function startVideoRecording() {
    if (state.status !== "preview" || !streamRef.current || !videoSupported) {
      return;
    }

    const mimeType = getSupportedCameraVideoMimeType();
    if (!mimeType) {
      onError("Video recording is not supported on this device.");
      return;
    }

    chunksRef.current = [];
    mimeTypeRef.current = mimeType;

    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setState({ status: "preview" });
        setElapsedMs(0);
        onError("Recording stopped unexpectedly. Try again.");
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        chunksRef.current = [];
        mediaRecorderRef.current = null;

        if (blob.size === 0) {
          setState({ status: "preview" });
          setElapsedMs(0);
          onError("That recording was empty. Try again.");
          return;
        }

        const file = buildCameraVideoFile(blob, mimeTypeRef.current);
        closeCamera();
        onCaptured(file);
      };

      recorder.start(250);
      setElapsedMs(0);
      setState({ status: "recording", startedAt: Date.now() });
    } catch {
      onError("Could not start video recording on this device.");
    }
  }

  function stopVideoRecording() {
    if (
      mediaRecorderRef.current?.state === "recording" ||
      mediaRecorderRef.current?.state === "paused"
    ) {
      setState({ status: "processing" });
      mediaRecorderRef.current.stop();
    }
  }

  async function changeMode(nextMode: CaptureMode) {
    if (state.status !== "preview" || nextMode === mode) {
      setMode(nextMode);
      return;
    }

    try {
      stopStream();
      const stream = await openCameraStream(
        facingMode,
        nextMode === "video" && videoSupported,
      );
      await bindStream(stream);
      setMode(nextMode);
      setState({ status: "preview" });
    } catch {
      onError("Could not switch capture mode. Try again.");
      closeCamera();
    }
  }

  if (!supported) {
    return null;
  }

  const isPreview =
    state.status === "preview" ||
    state.status === "capturing" ||
    state.status === "recording" ||
    state.status === "processing";
  const isBusy =
    state.status === "capturing" ||
    state.status === "recording" ||
    state.status === "processing";
  const visualZoom = zoomCapabilities.hardware ? 1 : zoom;

  const fullscreenOverlay =
    mounted && isPreview
      ? createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-black">
            <div
              className="relative min-h-0 flex-1 overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => {
                pinchDistanceRef.current = null;
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover transition-transform duration-150 ease-out"
                style={{
                  transform: `scale(${visualZoom})`,
                  transformOrigin: "center center",
                }}
              />

              <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/55 to-transparent px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-base font-semibold text-white">
                    {mode === "photo" ? "Take a photo" : "Record a video"}
                  </p>
                  <button
                    type="button"
                    className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white"
                    aria-label="Close camera"
                    disabled={isBusy}
                    onClick={closeCamera}
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              </div>

              {state.status === "recording" || state.status === "processing" ? (
                <div className="pointer-events-none absolute inset-x-0 top-[max(4.5rem,env(safe-area-inset-top))] flex justify-center">
                  <p
                    className="inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-sm font-medium text-white"
                    role="status"
                    aria-live="polite"
                  >
                    <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
                    {state.status === "processing"
                      ? "Finishing video…"
                      : `Recording ${formatRecordingDuration(elapsedMs)}`}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="shrink-0 space-y-4 border-t border-white/10 bg-black/80 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
              {zoomCapabilities.max > zoomCapabilities.min ? (
                <label className="block text-white">
                  <span className="mb-2 flex items-center justify-between text-xs font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <ZoomIn className="h-3.5 w-3.5" aria-hidden />
                      Zoom
                    </span>
                    <span>{formatZoomLabel(zoom)}</span>
                  </span>
                  <input
                    type="range"
                    aria-label="Zoom"
                    min={zoomCapabilities.min}
                    max={zoomCapabilities.max}
                    step={zoomCapabilities.step}
                    value={zoom}
                    disabled={isBusy}
                    onChange={(event) => {
                      void updateZoom(Number(event.currentTarget.value));
                    }}
                    className="w-full accent-accent"
                  />
                </label>
              ) : null}

              {videoSupported && state.status === "preview" ? (
                <div
                  className="inline-flex rounded-xl border border-white/15 bg-white/10 p-1"
                  role="group"
                  aria-label="Capture mode"
                >
                  <button
                    type="button"
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                      mode === "photo"
                        ? "bg-accent text-white"
                        : "text-white/75 hover:text-white",
                    )}
                    onClick={() => void changeMode("photo")}
                  >
                    Photo
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                      mode === "video"
                        ? "bg-accent text-white"
                        : "text-white/75 hover:text-white",
                    )}
                    onClick={() => void changeMode("video")}
                  >
                    Video
                  </button>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-center gap-2">
                {state.status === "preview" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                    onClick={() => void switchCamera()}
                  >
                    <SwitchCamera className="h-4 w-4" aria-hidden />
                    Flip camera
                  </Button>
                ) : null}

                {mode === "photo" ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => void takePhoto()}
                  >
                    <Camera className="h-4 w-4" aria-hidden />
                    {state.status === "capturing"
                      ? "Capturing…"
                      : "Capture photo"}
                  </Button>
                ) : state.status === "recording" ||
                  state.status === "processing" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={state.status === "processing"}
                    onClick={stopVideoRecording}
                  >
                    <Square className="h-4 w-4" aria-hidden />
                    Stop recording
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isBusy || !videoSupported}
                    onClick={startVideoRecording}
                  >
                    <Video className="h-4 w-4" aria-hidden />
                    Start recording
                  </Button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="rounded-xl border border-border bg-accent-subtle/30 p-4">
        <p className="text-sm font-medium text-ink">Or use your camera</p>
        <p className="mt-1 text-xs text-muted">
          Take a photo or record a short video in full screen.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled || isPreview}
            onClick={() => void openCamera("photo")}
          >
            <Camera className="h-4 w-4" aria-hidden />
            Take photo
          </Button>
          {videoSupported ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled || isPreview}
              onClick={() => void openCamera("video")}
            >
              <Video className="h-4 w-4" aria-hidden />
              Record video
            </Button>
          ) : null}
        </div>
      </div>

      {fullscreenOverlay}
    </>
  );
}
