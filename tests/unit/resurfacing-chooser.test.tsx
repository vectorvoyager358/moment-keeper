import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ResurfacingChooser } from "@/components/timeline/ResurfacingChooser";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("ResurfacingChooser", () => {
  beforeEach(() => {
    push.mockReset();
  });

  afterEach(cleanup);

  it("navigates with selected themes and media type", () => {
    render(<ResurfacingChooser />);

    fireEvent.click(screen.getByRole("button", { name: "Joy" }));
    fireEvent.change(screen.getByLabelText("Include"), {
      target: { value: "video" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Bring them back" }));

    expect(push).toHaveBeenCalledWith("/timeline?theme=joy&media=video");
  });

  it("requires at least one theme", () => {
    render(<ResurfacingChooser />);

    expect(
      screen.getByRole("button", { name: "Bring them back" }),
    ).toBeDisabled();
  });
});
