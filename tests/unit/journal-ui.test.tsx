import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MomentDetailView } from "@/components/moments/MomentDetailView";
import { MomentCard } from "@/components/timeline/MomentCard";

afterEach(cleanup);

describe("MomentCard", () => {
  it("shows a video frame instead of a generic media tile", async () => {
    const { container } = render(
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
          videoStoragePath: "user/m/video.mp4",
          videoUrl: "https://example.com/video.mp4",
        }}
      />,
    );

    expect(screen.getByRole("img", { name: "Video thumbnail" })).toBeVisible();
    await waitFor(() => {
      expect(container.querySelector("video")).toHaveAttribute(
        "src",
        "https://example.com/video.mp4#t=0.1",
      );
    });
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
          videoStoragePath: null,
          videoUrl: null,
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
          body_content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "A photo memory",
                    marks: [{ type: "bold" }],
                  },
                ],
              },
            ],
          },
          occurred_at: "2026-07-09T12:00:00.000Z",
          location: "Houston",
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
    expect(body.tagName).toBe("STRONG");

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
    expect(screen.getByText("Houston")).toBeVisible();
    expect(screen.getByText(/Jul 9, 2026 ·/)).toBeVisible();
    const editButton = screen.getByRole("button", { name: "Edit moment" });
    const deleteButton = screen.getByRole("button", { name: "Delete moment" });

    expect(editButton).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Back to your journal" }),
    ).toHaveAttribute("href", "/timeline");
    expect(deleteButton).toBeVisible();
    expect(
      editButton.compareDocumentPosition(deleteButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      deleteButton.compareDocumentPosition(body) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.queryByText("Moment kept")).not.toBeInTheDocument();
  });

  it("returns to the new cover when the attachment order changes", () => {
    const originalMoment = {
      id: "moment-1",
      body: "A photo memory",
      occurred_at: "2026-07-09T12:00:00.000Z",
      location: null,
      link_url: null,
      is_favorite: false,
      themes: [],
      tags: [],
      media: [
        {
          id: "media-old",
          media_type: "photo" as const,
          mime_type: "image/jpeg",
          original_filename: "old-cover.jpg",
          signedUrl: "https://example.com/old-cover.jpg",
          display_order: 0,
        },
      ],
    };
    const { rerender } = render(
      <MomentDetailView moment={originalMoment} onEdit={vi.fn()} />,
    );
    const carousel = screen.getByTestId("moment-media-carousel");
    carousel.scrollLeft = 390;

    rerender(
      <MomentDetailView
        moment={{
          ...originalMoment,
          media: [
            {
              id: "media-new",
              media_type: "photo",
              mime_type: "image/jpeg",
              original_filename: "new-cover.jpg",
              signedUrl: "https://example.com/new-cover.jpg",
              display_order: 0,
            },
            {
              ...originalMoment.media[0],
              display_order: 1,
            },
          ],
        }}
        onEdit={vi.fn()}
      />,
    );

    expect(carousel.scrollLeft).toBe(0);
    expect(
      screen
        .getByRole("img", { name: "new-cover.jpg" })
        .compareDocumentPosition(
          screen.getByRole("img", { name: "old-cover.jpg" }),
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("opens the selected attachment and swipes through the preview", () => {
    render(
      <MomentDetailView
        moment={{
          id: "moment-1",
          body: "Two photo memory",
          occurred_at: "2026-07-09T12:00:00.000Z",
          location: null,
          link_url: null,
          is_favorite: false,
          themes: [],
          tags: [],
          media: [
            {
              id: "media-1",
              media_type: "photo",
              mime_type: "image/jpeg",
              original_filename: "first.jpg",
              signedUrl: "https://example.com/first.jpg",
              display_order: 0,
            },
            {
              id: "media-2",
              media_type: "photo",
              mime_type: "image/jpeg",
              original_filename: "second.jpg",
              signedUrl: "https://example.com/second.jpg",
              display_order: 1,
            },
          ],
        }}
        onEdit={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "View photo full screen" })[0],
    );

    expect(screen.getByText("1 / 2")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Download first.jpg" }),
    ).toBeVisible();

    const previewCarousel = screen.getByTestId("media-preview-carousel");
    Object.defineProperty(previewCarousel, "clientWidth", {
      configurable: true,
      value: 320,
    });
    previewCarousel.scrollLeft = 320;
    fireEvent.scroll(previewCarousel);

    expect(screen.getByText("2 / 2")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Download second.jpg" }),
    ).toBeVisible();
  });
});
