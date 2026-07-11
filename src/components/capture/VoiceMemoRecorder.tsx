"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/Button";
import {
  buildVoiceMemoFile,
  formatRecordingDuration,
  getSupportedVoiceMemoMimeType,
  isVoiceMemoSupported,
  MAX_VOICE_MEMO_MS,
} from "@/lib/moments/voice-recorder";

type VoiceMemoRecorderProps = {
  onRecordingChange: (isRecording: boolean) => void;
  onRecorded: (file: File) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

type RecorderState =
  | { status: "idle" }
  | { status: "recording"; startedAt: number }
  | { status: "processing" };

function subscribeToVoiceMemoSupport() {
  return () => {};
}

export function VoiceMemoRecorder({
  onRecordingChange,
  onRecorded,
  onError,
  disabled = false,
}: VoiceMemoRecorderProps) {
  const [state, setState] = useState<RecorderState>({ status: "idle" });
  const [elapsedMs, setElapsedMs] = useState(0);
  const supported = useSyncExternalStore(
    subscribeToVoiceMemoSupport,
    isVoiceMemoSupported,
    () => false,
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  useEffect(() => {
    if (state.status !== "recording") {
      return;
    }

    const intervalId = window.setInterval(() => {
      const nextElapsed = Date.now() - state.startedAt;
      setElapsedMs(nextElapsed);

      if (
        nextElapsed >= MAX_VOICE_MEMO_MS &&
        mediaRecorderRef.current?.state === "recording"
      ) {
        setState({ status: "processing" });
        mediaRecorderRef.current.stop();
      }
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [state]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    if (disabled || state.status === "recording") {
      return;
    }

    const mimeType = getSupportedVoiceMemoMimeType();
    if (!mimeType) {
      onError("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        onError("Recording failed. Try again or upload an audio file instead.");
        stopStream();
        setState({ status: "idle" });
        onRecordingChange(false);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current,
        });
        stopStream();
        mediaRecorderRef.current = null;

        if (blob.size === 0) {
          setState({ status: "idle" });
          onRecordingChange(false);
          return;
        }

        onRecorded(buildVoiceMemoFile(blob, mimeTypeRef.current));
        setState({ status: "idle" });
        setElapsedMs(0);
        onRecordingChange(false);
      };

      recorder.start(250);
      setElapsedMs(0);
      setState({ status: "recording", startedAt: Date.now() });
      onRecordingChange(true);
    } catch {
      stopStream();
      onError(
        "Microphone access was denied. Allow mic permission or upload an audio file instead.",
      );
    }
  }

  async function stopRecording() {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      return;
    }

    setState({ status: "processing" });
    recorder.stop();
  }

  if (!supported) {
    return null;
  }

  const isRecording = state.status === "recording";
  const isProcessing = state.status === "processing";

  return (
    <div className="rounded-xl border border-border bg-accent-subtle/30 p-4">
      <p className="text-sm font-medium text-ink">Or record a voice memo.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!isRecording ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled || isProcessing}
            onClick={() => void startRecording()}
          >
            <Mic className="h-4 w-4" aria-hidden />
            {isProcessing ? "Getting your voice memo ready…" : "Start talking"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => void stopRecording()}
          >
            <Square className="h-3.5 w-3.5 fill-current" aria-hidden />
            Stop
          </Button>
        )}

        {isRecording ? (
          <p
            className="font-mono text-sm tabular-nums text-accent"
            role="status"
            aria-live="polite"
          >
            {formatRecordingDuration(elapsedMs)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
