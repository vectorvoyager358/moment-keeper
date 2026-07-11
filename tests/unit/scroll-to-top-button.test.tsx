import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";

afterEach(cleanup);

describe("ScrollToTopButton", () => {
  beforeEach(() => {
    vi.stubGlobal("scrollTo", vi.fn());
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("appears after scrolling down and returns to the top when clicked", () => {
    render(<ScrollToTopButton />);

    const button = screen.getByRole("button", { name: "Back to top" });
    expect(button.className).toContain("opacity-0");

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 500,
    });
    fireEvent.scroll(window);

    expect(button.className).toContain("opacity-100");

    fireEvent.click(button);

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });
});
