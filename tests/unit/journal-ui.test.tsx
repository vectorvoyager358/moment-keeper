import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MomentDetailView } from "@/components/moments/MomentDetailView";
import { MomentCard } from "@/components/timeline/MomentCard";

afterEach(cleanup);

describe("MomentCard", () => {
  it("can server-render the original photo for resilient calendar cards", () => {
    render(
      <MomentCard
        preferOriginalPhoto
        moment={{
          id: "moment-photo",
          body: "A photo memory",
          occurred_at: "2026-07-09T12:00:00.000Z",
          location: null,
          linkUrl: null,
          isFavorite: false,
          tags: [],
          hasMedia: true,
          attachmentCount: 1,
          mediaType: "photo",
          thumbnailPath: "photo.thumb.jpg",
          thumbnailUrl: "https://example.com/broken-thumb.jpg",
          photoStoragePath: "photo.jpg",
          photoUrl: "https://example.com/original.jpg",
        }}
      />,
    );

    expect(document.querySelector("article img")).toHaveAttribute(
      "src",
      "https://example.com/original.jpg",
    );
  });

  it("uses a viewport-aware media frame for compact previews", () => {
    render(
      <MomentCard
        compact
        moment={{
          id: "moment-compact",
          body: "A compact memory",
          occurred_at: "2026-07-09T12:00:00.000Z",
          location: null,
          linkUrl: null,
          isFavorite: false,
          tags: [],
          hasMedia: true,
          attachmentCount: 1,
          mediaType: "photo",
          thumbnailPath: null,
          thumbnailUrl: null,
          photoStoragePath: "photo.jpg",
          photoUrl: "https://example.com/photo.jpg",
        }}
      />,
    );

    const article = document.querySelector("article");
    const cardLink = document.querySelector("article > a");
    const previewImage = document.querySelector("article img");

    expect(document.querySelector("article a > div")).toHaveClass(
      "h-[clamp(7rem,22svh,10rem)]",
    );
    expect(previewImage).toHaveClass("object-cover");
    expect(previewImage).not.toHaveClass("object-contain");
    expect(article).toHaveClass("w-full", "min-w-0", "max-w-full");
    expect(cardLink).toHaveClass(
      "w-full",
      "min-w-0",
      "max-w-full",
      "overflow-hidden",
    );
  });

  it("uses the same preview frame for videos without poster images", () => {
    render(
      <MomentCard
        compact
        moment={{
          id: "moment-video",
          body: "A video memory",
          occurred_at: "2026-07-09T12:00:00.000Z",
          location: null,
          linkUrl: null,
          isFavorite: false,
          tags: [],
          hasMedia: true,
          attachmentCount: 1,
          mediaType: "video",
          thumbnailPath: null,
          thumbnailUrl: null,
          photoStoragePath: null,
          photoUrl: null,
        }}
      />,
    );

    expect(
      screen.getByText("A video").parentElement?.parentElement,
    ).toHaveClass("h-52", "h-[clamp(7rem,22svh,10rem)]", "sm:aspect-[3/2]");
  });

  it("shows a visual tile for media without a thumbnail", () => {
    render(
      <MomentCard
        moment={{
          id: "moment-1",
          body: "A video memory",
          occurred_at: "2026-07-09T12:00:00.000Z",
          location: null,
          linkUrl: "https://example.com/video",
          isFavorite: true,
          tags: [{ id: "tag-1", name: "travel" }],
          hasMedia: true,
          attachmentCount: 1,
          mediaType: "video",
          thumbnailPath: null,
          thumbnailUrl: null,
          photoStoragePath: null,
          photoUrl: null,
        }}
      />,
    );

    expect(screen.getByText("A video")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "See moments tagged travel" }),
    ).toHaveAttribute("href", "/timeline?tag=tag-1");
  });

  it("highlights matching search terms in the body", () => {
    const { container } = render(
      <MomentCard
        highlightQuery="proud"
        moment={{
          id: "moment-2",
          body: "A proud day",
          occurred_at: "2026-07-09T12:00:00.000Z",
          location: null,
          linkUrl: null,
          isFavorite: false,
          tags: [],
          hasMedia: false,
          attachmentCount: 0,
          mediaType: null,
          thumbnailPath: null,
          thumbnailUrl: null,
          photoStoragePath: null,
          photoUrl: null,
        }}
      />,
    );

    expect(container.querySelector("mark")).toHaveTextContent("proud");
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
          location: null,
          link_url: "https://www.example.com/family-story",
          is_favorite: true,
          themes: ["joy"],
          tags: [{ id: "tag-1", name: "family" }],
          media: [
            {
              id: "media-1",
              media_type: "photo",
              mime_type: "image/jpeg",
              original_filename: "memory.jpg",
              signedUrl: "https://example.com/memory.jpg",
              display_order: 0,
            },
          ],
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
      screen.getByRole("link", { name: "See moments tagged family" }),
    ).toHaveAttribute("href", "/timeline?tag=tag-1");
    expect(screen.getByRole("link", { name: "Joy" })).toHaveAttribute(
      "href",
      "/timeline?theme=joy",
    );
    expect(
      screen.getByRole("link", {
        name: "Open link to example.com in a new tab",
      }),
    ).toHaveAttribute("rel", "noopener noreferrer");
  });
});
