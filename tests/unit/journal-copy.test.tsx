import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AppNav } from "@/components/AppNav";
import { BrowseTabs } from "@/components/browse/BrowseTabs";

afterEach(cleanup);

describe("journal-focused navigation copy", () => {
  it("uses warm, consistent labels in the main navigation", () => {
    render(<AppNav current="timeline" />);

    expect(screen.getByRole("link", { name: "Journal" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Keep" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Look back" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Account" })).toBeVisible();
  });

  it("describes browse views by user intent", () => {
    render(<BrowseTabs active="calendar" />);

    expect(screen.getByRole("link", { name: "By date" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Media" })).toBeVisible();
  });
});
