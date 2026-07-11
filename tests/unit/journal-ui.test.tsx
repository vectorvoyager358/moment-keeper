import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MomentDetailView } from "@/components/moments/MomentDetailView";
import { MomentCard } from "@/components/timeline/MomentCard";

afterEach(cleanup);

describe("MomentCard", () => {
  it("shows a visual tile for media without a thumbnail", () => {
    render(
      <MomentCard
        moment={{
          id: "moment-1",
          body: "A video memory",
          occurred_at: "2026-07-09T12:00:00.000Z",
          tags: [{ id: "tag-1", name: "travel" }],
          hasMedia: true,
          mediaType: "video",
          thumbnailPath: null,
          thumbnailUrl: null,
        }}
      />,
    );

    expect(screen.getByText("Video moment")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Filter timeline by travel" }),
    ).toHaveAttribute("href", "/timeline?tag=tag-1");
  });
});

describe("MomentDetailView", () => {
  it("places visual media before the entry and links tags to filters", () => {
    render(
      <MomentDetailView
        moment={{
          id: "moment-1",
          body: "A photo memory",
          occurred_at: "2026-07-09T12:00:00.000Z",
          themes: ["joy"],
          tags: [{ id: "tag-1", name: "family" }],
          media: {
            id: "media-1",
            media_type: "photo",
            mime_type: "image/jpeg",
            original_filename: "memory.jpg",
            signedUrl: "https://example.com/memory.jpg",
          },
        }}
        onEdit={vi.fn()}
      />,
    );

    const image = screen.getByRole("img", { name: "memory.jpg" });
    const body = screen.getByText("A photo memory");

    expect(
      image.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Filter timeline by family" }),
    ).toHaveAttribute("href", "/timeline?tag=tag-1");
    expect(screen.getByRole("link", { name: "Joy" })).toHaveAttribute(
      "href",
      "/timeline?theme=joy",
    );
  });
});
