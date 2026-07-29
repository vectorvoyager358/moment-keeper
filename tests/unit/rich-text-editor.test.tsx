import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RichTextEditor } from "@/components/editor/RichTextEditor";

afterEach(cleanup);

describe("RichTextEditor", () => {
  it("exposes a mobile-friendly formatting toolbar and editable content", async () => {
    render(
      <RichTextEditor
        id="moment-body"
        value={{ text: "A meaningful memory", content: null }}
        onChange={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("toolbar", { name: "Text formatting" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Bold" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Italic" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Bulleted list" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Add link" }),
    ).not.toBeInTheDocument();
    expect(await screen.findByRole("textbox")).toHaveTextContent(
      "A meaningful memory",
    );
  });
});
