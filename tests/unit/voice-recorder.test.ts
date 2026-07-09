import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildVoiceMemoFile,
  formatRecordingDuration,
  getSupportedVoiceMemoMimeType,
  normalizeVoiceMemoMimeType,
} from "@/lib/moments/voice-recorder";

describe("formatRecordingDuration", () => {
  it("formats minutes and zero-padded seconds", () => {
    expect(formatRecordingDuration(0)).toBe("0:00");
    expect(formatRecordingDuration(65_000)).toBe("1:05");
    expect(formatRecordingDuration(600_000)).toBe("10:00");
  });
});

describe("normalizeVoiceMemoMimeType", () => {
  it("strips codec parameters", () => {
    expect(normalizeVoiceMemoMimeType("audio/webm;codecs=opus")).toBe(
      "audio/webm",
    );
  });
});

describe("buildVoiceMemoFile", () => {
  it("creates a validated audio file with a webm extension", () => {
    const file = buildVoiceMemoFile(
      new Blob(["audio"], { type: "audio/webm" }),
      "audio/webm;codecs=opus",
    );

    expect(file.type).toBe("audio/webm");
    expect(file.name).toMatch(/^voice-memo-.*\.webm$/);
    expect(file.size).toBeGreaterThan(0);
  });
});

describe("getSupportedVoiceMemoMimeType", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the first supported mime type", () => {
    vi.stubGlobal("MediaRecorder", {
      isTypeSupported: (type: string) => type.startsWith("audio/webm"),
    });

    expect(getSupportedVoiceMemoMimeType()).toBe("audio/webm;codecs=opus");
  });
});
