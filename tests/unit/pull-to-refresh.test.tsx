import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getPullDistance,
  PullToRefresh,
  shouldTriggerRefresh,
} from "@/components/ui/PullToRefresh";

afterEach(cleanup);

describe("PullToRefresh", () => {
  it("ignores upward or mid-page movement", () => {
    expect(getPullDistance(80, 40, 0)).toBe(0);
    expect(getPullDistance(40, 120, 80)).toBe(0);
  });

  it("triggers only after a deliberate pull", () => {
    expect(shouldTriggerRefresh(getPullDistance(0, 80, 0))).toBe(false);
    expect(shouldTriggerRefresh(getPullDistance(0, 160, 0))).toBe(true);
  });

  it("refreshes when the user pulls far enough and releases", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <PullToRefresh onRefresh={onRefresh}>
        <p>Journal</p>
      </PullToRefresh>,
    );

    const surface = screen.getByText("Journal").parentElement;
    expect(surface).toBeTruthy();

    fireEvent.touchStart(surface!, {
      touches: [{ clientY: 0 }],
    });
    fireEvent.touchMove(surface!, {
      touches: [{ clientY: 180 }],
    });
    fireEvent.touchEnd(surface!);

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledOnce();
    });
  });
});
