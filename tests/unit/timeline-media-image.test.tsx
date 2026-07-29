import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TimelineMediaImage } from "@/components/timeline/TimelineMediaImage";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TimelineMediaImage", () => {
  it("eagerly prioritizes the first visible cover", () => {
    render(
      <TimelineMediaImage
        src="https://example.com/thumb.jpg"
        alt="First memory"
        priority
      />,
    );

    expect(screen.getByRole("img", { name: "First memory" })).toHaveAttribute(
      "loading",
      "eager",
    );
    expect(screen.getByRole("img", { name: "First memory" })).toHaveAttribute(
      "fetchpriority",
      "high",
    );
  });

  it("falls back to the full photo when the thumbnail fails to load", async () => {
    render(
      <TimelineMediaImage
        src="https://example.com/thumb.jpg"
        fallbackSrc="https://example.com/full.jpg"
        alt="Memory photo"
      />,
    );

    const thumbnail = await screen.findByRole("img", {
      name: "Memory photo",
    });
    fireEvent.error(thumbnail);

    const fallback = screen.getByRole("img", { name: "Memory photo" });
    expect(fallback).not.toBe(thumbnail);
    expect(fallback).toHaveAttribute("src", "https://example.com/full.jpg");
  });

  it("removes a broken image after every source fails", async () => {
    render(
      <TimelineMediaImage
        src="https://example.com/thumb.jpg"
        fallbackSrc="https://example.com/full.jpg"
        alt="Memory photo"
      />,
    );

    fireEvent.error(await screen.findByRole("img", { name: "Memory photo" }));
    fireEvent.error(screen.getByRole("img", { name: "Memory photo" }));

    expect(
      screen.queryByRole("img", { name: "Memory photo" }),
    ).not.toBeInTheDocument();
  });

  it("requests the original photo only after its thumbnail fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://example.com/on-demand-full.jpg" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TimelineMediaImage
        src="https://example.com/thumb.jpg"
        fallbackRequestUrl="/api/moments/moment-1/media-fallback"
        alt="On-demand memory photo"
      />,
    );

    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.error(
      screen.getByRole("img", { name: "On-demand memory photo" }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("img", { name: "On-demand memory photo" }),
      ).toHaveAttribute("src", "https://example.com/on-demand-full.jpg");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/moments/moment-1/media-fallback",
      {
        credentials: "same-origin",
        cache: "no-store",
      },
    );
  });

  it("refreshes the original after both cached signed URLs expire", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://example.com/refreshed-full.jpg" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TimelineMediaImage
        src="https://example.com/expired-thumb.jpg"
        fallbackSrc="https://example.com/expired-full.jpg"
        fallbackRequestUrl="/api/moments/moment-1/media-fallback"
        alt="Resumed PWA photo"
      />,
    );

    fireEvent.error(screen.getByRole("img", { name: "Resumed PWA photo" }));
    expect(
      screen.getByRole("img", { name: "Resumed PWA photo" }),
    ).toHaveAttribute("src", "https://example.com/expired-full.jpg");

    fireEvent.error(screen.getByRole("img", { name: "Resumed PWA photo" }));

    await waitFor(() => {
      expect(
        screen.getByRole("img", { name: "Resumed PWA photo" }),
      ).toHaveAttribute("src", "https://example.com/refreshed-full.jpg");
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
