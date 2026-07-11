import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { replace } = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { SavedToast } from "@/components/ui/SavedToast";

afterEach(cleanup);

describe("SavedToast", () => {
  it("shows a first-moment hint when provided", () => {
    render(
      <SavedToast
        initialVisible
        hint="Next time, open Add more on Keep to attach a photo or voice memo."
      />,
    );

    expect(
      screen.getByText("Kept — it's now part of your journal."),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Next time, open Add more on Keep to attach a photo or voice memo.",
      ),
    ).toBeVisible();
  });
});
