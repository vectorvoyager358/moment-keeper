import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

afterEach(cleanup);

describe("ConfirmDialog", () => {
  it("portals above page stacking contexts", () => {
    const { container } = render(
      <div className="isolate">
        <ConfirmDialog
          open
          title="Remove this moment?"
          description="This cannot be undone."
          confirmLabel="Delete moment"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      </div>,
    );

    const dialog = screen.getByRole("alertdialog");
    const overlay = dialog.parentElement;

    expect(container).not.toContainElement(dialog);
    expect(document.body).toContainElement(dialog);
    expect(overlay).toHaveClass("fixed", "inset-0", "z-[100]", "items-center");
    expect(overlay).not.toHaveClass("items-end");
  });

  it("keeps both actions on the same row", () => {
    render(
      <ConfirmDialog
        open
        title="Remove this moment?"
        description="This cannot be undone."
        confirmLabel="Delete moment"
        cancelLabel="Keep it"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const keepButton = screen.getByRole("button", { name: "Keep it" });
    const deleteButton = screen.getByRole("button", {
      name: "Delete moment",
    });
    const actions = keepButton.parentElement;

    expect(actions).toBe(deleteButton.parentElement);
    expect(actions).toHaveClass("grid", "grid-cols-2");
  });

  it("closes from the backdrop or Escape key", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Remove this moment?"
        description="This cannot be undone."
        confirmLabel="Delete moment"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    fireEvent.keyDown(window, { key: "Escape" });

    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
