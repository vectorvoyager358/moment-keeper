import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loadBrowseGallery, loadBrowseCalendar } = vi.hoisted(() => ({
  loadBrowseGallery: vi.fn(),
  loadBrowseCalendar: vi.fn(),
}));

vi.mock("@/app/browse/actions", () => ({
  loadBrowseGallery,
  loadBrowseCalendar,
}));

import { BrowseContent } from "@/components/browse/BrowseContent";
import {
  invalidateAllViewCaches,
  setGalleryView,
} from "@/lib/moments/view-cache";

const photo = {
  id: "photo-1",
  momentId: "m1",
  body: "A still morning",
  occurred_at: "2026-08-13T12:00:00.000Z",
  location: null,
  mediaType: "photo" as const,
  thumbnailUrl: null,
  photoUrl: null,
  videoUrl: null,
};

const video = {
  id: "video-1",
  momentId: "m2",
  body: "A moving afternoon",
  occurred_at: "2026-08-12T12:00:00.000Z",
  location: null,
  mediaType: "video" as const,
  thumbnailUrl: null,
  photoUrl: null,
  videoUrl: null,
};

beforeEach(() => {
  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
  invalidateAllViewCaches();
  loadBrowseGallery.mockReset().mockResolvedValue({ items: [photo, video] });
  loadBrowseCalendar.mockReset().mockResolvedValue({ moments: [] });
});

afterEach(cleanup);

describe("BrowseContent", () => {
  it("filters photos and videos from the remembered everything gallery", () => {
    setGalleryView(null, { items: [photo, video] });

    render(<BrowseContent view="media" mediaType={null} />);

    expect(screen.getByLabelText("Photo: A still morning")).toBeVisible();
    expect(screen.getByLabelText("Video: A moving afternoon")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Photos" }));

    expect(screen.getByLabelText("Photo: A still morning")).toBeVisible();
    expect(
      screen.queryByLabelText("Video: A moving afternoon"),
    ).not.toBeInTheDocument();
    expect(loadBrowseGallery).not.toHaveBeenCalled();
  });
});
