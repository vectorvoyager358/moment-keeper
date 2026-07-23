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

    fireEvent.click(screen.getByRole("button", { name: "Add to favorites" }));

    const favoriteButton = screen.getByRole("button", {
      name: "Remove from favorites",
    });

    expect(favoriteButton).toHaveAttribute("aria-pressed", "true");
    expect(favoriteButton).toHaveClass("!text-[#ed4956]");
    expect(favoriteButton.querySelector("svg")).toHaveClass(
      "fill-current",
      "animate-heart-pop",
    );
    expect(
      favoriteButton.querySelector(".favorite-heart-burst"),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(setMomentFavorite).toHaveBeenCalledWith("moment-1", true);
    });
  });
});
