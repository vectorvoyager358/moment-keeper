import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AppNav } from "@/components/AppNav";
import { BrowseTabs } from "@/components/browse/BrowseTabs";

afterEach(cleanup);

describe("journal-focused navigation copy", () => {
  it("uses warm, consistent labels in the main navigation", () => {
    render(<AppNav current="timeline" />);

    expect(screen.getAllByRole("link", { name: "Journal" })[0]).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Capture" })[0]).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Look back" })[0]).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Account" })[0]).toBeVisible();
  });

  it("renders a dedicated mobile bottom navigation bar", () => {
    render(<AppNav current="capture" />);

    const mobileNavs = screen.getAllByRole("navigation", { name: "Main" });
    expect(mobileNavs).toHaveLength(2);
    expect(mobileNavs[1]).toHaveClass("md:hidden");
    expect(mobileNavs[1]).toHaveClass("bottom-0");
  });

  it("describes browse views by user intent", () => {
    render(<BrowseTabs active="calendar" />);

    expect(screen.getByRole("link", { name: "By date" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Media" })).toBeVisible();
  });
});
