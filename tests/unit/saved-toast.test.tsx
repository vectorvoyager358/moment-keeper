import { cleanup, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { replace } = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { SavedToast } from "@/components/ui/SavedToast";

afterEach(cleanup);

describe("SavedToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockReset();
    window.history.replaceState({}, "", "/timeline?saved=1");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a first-moment hint when provided", () => {
    render(
      <SavedToast
        initialVisible
        hint="Next time, open Add more on Keep to attach a photo or voice memo."
      />,
    );

    expect(
      screen.getByText("Saved — it's now part of your journal."),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Next time, open Add more on Keep to attach a photo or voice memo.",
      ),
    ).toBeVisible();
  });

  it("auto-dismisses after five seconds even when the saved query param is removed", () => {
    render(<SavedToast initialVisible />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(
      screen.queryByText("Saved — it's now part of your journal."),
    ).not.toBeInTheDocument();
  });

  it("shows a custom message and clears a custom query param", () => {
    window.history.replaceState({}, "", "/moments/moment-1?updated=1");

    render(
      <SavedToast
        initialVisible
        queryParam="updated"
        message="Saved — your changes are kept."
      />,
    );

    expect(screen.getByText("Saved — your changes are kept.")).toBeVisible();
  });

  it("shows deletion confirmation and clears its query param", () => {
    window.history.replaceState({}, "", "/timeline?deleted=1");

    render(
      <SavedToast
        initialVisible
        queryParam="deleted"
        message="Moment deleted."
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Moment deleted.");
    expect(replace).toHaveBeenCalledWith("/timeline", { scroll: false });
  });
});
