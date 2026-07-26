import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MediaDownloadButton } from "@/components/moments/MediaDownloadButton";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("MediaDownloadButton", () => {
  it("downloads signed media with its original filename", async () => {
    const downloaded: { href?: string; filename?: string } = {};
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(new Blob(["media"])),
      }),
    );
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:download"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function () {
        downloaded.href = this.href;
        downloaded.filename = this.download;
      },
    );

    render(
      <MediaDownloadButton
        src="https://example.com/signed-photo"
        filename="memory.jpg"
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Download memory.jpg" }),
    );

    await waitFor(() => {
      expect(downloaded).toEqual({
        href: "blob:download",
        filename: "memory.jpg",
      });
    });
  });
});
