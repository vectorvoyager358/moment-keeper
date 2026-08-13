import { cleanup, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

import { SavedToast } from "@/components/ui/SavedToast";

afterEach(cleanup);

describe("SavedToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockReset();
    refresh.mockReset();
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
    window.history.replaceState({}, "", "/timeline?deleted=moment-1");

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

  it("offers undo for ten seconds and refreshes restored moments", async () => {
    const onAction = vi.fn().mockResolvedValue({ error: null });
    const onExpire = vi.fn().mockResolvedValue(undefined);

    render(
      <SavedToast
        initialVisible
        message="Moment deleted."
        autoDismissMs={10_000}
        actionLabel="Undo"
        onAction={onAction}
        onExpire={onExpire}
      />,
    );

    expect(screen.getByRole("button", { name: "Undo" })).toBeVisible();

    await act(async () => {
      screen.getByRole("button", { name: "Undo" }).click();
    });

    expect(onAction).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(onExpire).not.toHaveBeenCalled();
  });

  it("keeps the deletion toast for ten seconds before finalizing", () => {
    const onExpire = vi.fn().mockResolvedValue(undefined);

    render(
      <SavedToast
        initialVisible
        message="Moment deleted."
        autoDismissMs={10_000}
        actionLabel="Undo"
        onAction={vi.fn().mockResolvedValue({ error: null })}
        onExpire={onExpire}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(9_999);
    });
    expect(screen.getByRole("status")).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(onExpire).toHaveBeenCalledOnce();
  });
});
