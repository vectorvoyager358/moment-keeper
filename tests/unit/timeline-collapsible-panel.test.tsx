import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TimelineCollapsiblePanel } from "@/components/timeline/TimelineCollapsiblePanel";

afterEach(cleanup);

describe("TimelineCollapsiblePanel", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("starts collapsed and reveals content when opened", () => {
    render(
      <TimelineCollapsiblePanel panelId="find" title="Find">
        <p>Search panel</p>
      </TimelineCollapsiblePanel>,
    );

    expect(screen.getByRole("button", { name: /Find/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("Search panel")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Find/i }));

    expect(screen.getByRole("button", { name: /Find/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Search panel")).toBeVisible();
    expect(sessionStorage.getItem("moment-keeper:timeline-panel:find")).toBe(
      "open",
    );
  });

  it("opens when initialOpen is true", () => {
    render(
      <TimelineCollapsiblePanel panelId="find" title="Find" initialOpen>
        <p>Search panel</p>
      </TimelineCollapsiblePanel>,
    );

    expect(screen.getByText("Search panel")).toBeVisible();
  });

  it("restores open state from the session", () => {
    sessionStorage.setItem("moment-keeper:timeline-panel:revisit", "open");

    render(
      <TimelineCollapsiblePanel panelId="revisit" title="Revisit">
        <p>Revisit panel</p>
      </TimelineCollapsiblePanel>,
    );

    expect(screen.getByText("Revisit panel")).toBeVisible();
  });
});
