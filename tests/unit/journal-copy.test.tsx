import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { routerPrefetch, routerPush, routerReplace } = vi.hoisted(() => ({
  routerPrefetch: vi.fn(),
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/timeline",
  useRouter: () => ({
    prefetch: routerPrefetch,
    push: routerPush,
    replace: routerReplace,
  }),
}));

import {
  AppNav,
  getMobileNavPosition,
  getNavIdForPathname,
} from "@/components/AppNav";
import { BrowseTabs } from "@/components/browse/BrowseTabs";
import { JournalGreeting } from "@/components/timeline/JournalGreeting";

afterEach(() => {
  cleanup();
  routerPrefetch.mockReset();
  routerPush.mockReset();
  routerReplace.mockReset();
});

function firePointerEvent(
  target: Element,
  type: "pointerdown" | "pointermove" | "pointerup",
  clientX: number,
) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    button: { value: 0 },
    clientX: { value: clientX },
    pointerId: { value: 1 },
  });
  fireEvent(target, event);
}

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
    expect(mobileNavs[1]).toHaveClass("rounded-[2rem]");
    expect(mobileNavs[1]).toHaveClass("max-w-sm");
    expect(mobileNavs[1]).toHaveClass("bg-surface/40");
    expect(mobileNavs[1]).not.toHaveClass("backdrop-blur-md");
    expect(screen.getAllByRole("link", { name: "Capture" })[1]).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(mobileNavs[1]).not.toHaveTextContent("Journal");
    expect(screen.getByTestId("mobile-nav-lens")).toHaveStyle({
      transform: "translateX(100%)",
    });
  });

  it("maps a horizontal swipe continuously across the mobile tabs", () => {
    expect(getMobileNavPosition(0, 0, 400, 4)).toBe(0);
    expect(getMobileNavPosition(200, 0, 400, 4)).toBe(1.5);
    expect(getMobileNavPosition(400, 0, 400, 4)).toBe(3);
  });

  it("maps protected routes to the persistent navigation", () => {
    expect(getNavIdForPathname("/timeline")).toBe("timeline");
    expect(getNavIdForPathname("/moments/moment-1")).toBe("timeline");
    expect(getNavIdForPathname("/capture")).toBe("capture");
    expect(getNavIdForPathname("/browse")).toBe("browse");
    expect(getNavIdForPathname("/settings")).toBe("settings");
    expect(getNavIdForPathname("/login")).toBeNull();
  });

  it("opens the nearest tab after dragging across the mobile navigation", () => {
    render(<AppNav current="timeline" />);

    const mobileNav = screen.getAllByRole("navigation", { name: "Main" })[1];
    vi.spyOn(mobileNav, "getBoundingClientRect").mockReturnValue({
      bottom: 64,
      height: 64,
      left: 0,
      right: 400,
      top: 0,
      width: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    firePointerEvent(mobileNav, "pointerdown", 50);
    firePointerEvent(mobileNav, "pointermove", 350);
    firePointerEvent(mobileNav, "pointerup", 350);

    expect(routerPrefetch).toHaveBeenCalledWith("/settings");
    expect(routerPush).toHaveBeenCalledWith("/settings", { scroll: false });
  });

  it("smoothly compacts the mobile navigation after scrolling", () => {
    render(<AppNav current="timeline" />);

    const mobileNav = screen.getAllByRole("navigation", { name: "Main" })[1];
    Object.defineProperty(window, "scrollY", { configurable: true, value: 80 });
    fireEvent.scroll(window);

    expect(mobileNav).toHaveAttribute("data-compact", "true");
    expect(mobileNav).toHaveClass("h-14");
    expect(mobileNav).toHaveClass("max-w-xs");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    fireEvent.scroll(window);
  });

  it("types a greeting on the journal home", async () => {
    render(<JournalGreeting name="Alex" />);

    expect(await screen.findByLabelText("Hi Alex")).toBeVisible();
  });

  it("describes browse views by user intent", () => {
    render(<BrowseTabs active="calendar" />);

    expect(screen.getByRole("link", { name: "By date" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Media" })).toBeVisible();
  });
});
