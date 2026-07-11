import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { deleteMoment } = vi.hoisted(() => ({
  deleteMoment: vi.fn(),
}));

vi.mock("@/app/moments/[id]/actions", () => ({ deleteMoment }));

import { DeleteMomentButton } from "@/components/moments/DeleteMomentButton";

afterEach(cleanup);

describe("DeleteMomentButton", () => {
  it("asks for confirmation in a branded dialog before deleting", () => {
    render(<DeleteMomentButton momentId="moment-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Delete moment" }));

    expect(
      screen.getByRole("alertdialog", { name: "Remove this moment?" }),
    ).toBeVisible();
    expect(screen.getByText(/leave your journal for good/i)).toBeVisible();
  });
});
