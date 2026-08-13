import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useVisibilityRefresh } from "@/lib/moments/use-cached-view";
import { VIEW_CACHE_HIDDEN_REFRESH_MS } from "@/lib/moments/view-cache";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function VisibilityProbe({ onRefresh }: { onRefresh: () => void }) {
  useVisibilityRefresh(onRefresh);
  return null;
}

describe("useVisibilityRefresh", () => {
  it("refreshes after the app has been hidden long enough", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T12:00:00.000Z"));
    const onRefresh = vi.fn();

    render(<VisibilityProbe onRefresh={onRefresh} />);

    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));

    vi.setSystemTime(
      new Date("2026-08-13T12:00:00.000Z").getTime() +
        VIEW_CACHE_HIDDEN_REFRESH_MS,
    );
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("does not refresh after a short backgrounding", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T12:00:00.000Z"));
    const onRefresh = vi.fn();

    render(<VisibilityProbe onRefresh={onRefresh} />);

    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));

    vi.setSystemTime(new Date("2026-08-13T12:01:00.000Z"));
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(onRefresh).not.toHaveBeenCalled();
  });
});
