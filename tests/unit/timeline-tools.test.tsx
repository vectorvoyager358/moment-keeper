import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TimelineTools } from "@/components/timeline/TimelineTools";

afterEach(cleanup);

describe("TimelineTools", () => {
  it("switches compact journal tools into one shared panel", () => {
    render(
      <TimelineTools
        findContent={<p>Find controls</p>}
        revisitContent={<p>Revisit controls</p>}
      />,
    );

    const findButton = screen.getByRole("button", { name: /Find/ });
    const revisitButton = screen.getByRole("button", { name: /Revisit/ });

    expect(findButton).toHaveAttribute("aria-expanded", "false");
    expect(revisitButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Find controls")).not.toBeInTheDocument();

    fireEvent.click(findButton);
    expect(findButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Find controls")).toBeVisible();

    fireEvent.click(revisitButton);
    expect(findButton).toHaveAttribute("aria-expanded", "false");
    expect(revisitButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText("Find controls")).not.toBeInTheDocument();
    expect(screen.getByText("Revisit controls")).toBeVisible();

    fireEvent.click(revisitButton);
    expect(screen.queryByText("Revisit controls")).not.toBeInTheDocument();
  });

  it("opens Find immediately when filters are active", () => {
    render(
      <TimelineTools
        initialTool="find"
        findContent={<p>Active search</p>}
        revisitContent={<p>Revisit controls</p>}
      />,
    );

    expect(screen.getByRole("button", { name: /Find/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Active search")).toBeVisible();
  });
});
