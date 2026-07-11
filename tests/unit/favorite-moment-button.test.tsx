import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { setMomentFavorite } = vi.hoisted(() => ({
  setMomentFavorite: vi.fn(),
}));

vi.mock("@/app/moments/[id]/actions", () => ({ setMomentFavorite }));

import { FavoriteMomentButton } from "@/components/moments/FavoriteMomentButton";

afterEach(cleanup);

describe("FavoriteMomentButton", () => {
  beforeEach(() => {
    setMomentFavorite.mockReset().mockResolvedValue({ error: null });
  });

  it("optimistically favorites a moment and persists it", async () => {
    render(
      <FavoriteMomentButton momentId="moment-1" initialFavorite={false} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save to favorites" }));

    expect(
      screen.getByRole("button", { name: "Remove from favorites" }),
    ).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => {
      expect(setMomentFavorite).toHaveBeenCalledWith("moment-1", true);
    });
  });
});
