import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { logout } = vi.hoisted(() => ({
  logout: vi.fn(),
}));

vi.mock("@/app/auth/actions", () => ({ logout }));

import { LogoutButton } from "@/components/settings/LogoutButton";

afterEach(cleanup);

describe("LogoutButton", () => {
  it("uses an icon-only trigger and asks before logging out", () => {
    render(<LogoutButton />);

    const trigger = screen.getByRole("button", { name: "Log out" });

    expect(trigger).not.toHaveTextContent("Log out");
    expect(trigger.querySelector("svg")).toBeInTheDocument();

    fireEvent.click(trigger);

    const dialog = screen.getByRole("alertdialog", { name: "Log out?" });
    expect(dialog).toBeVisible();
    expect(within(dialog).getByText(/need to sign in again/i)).toBeVisible();

    fireEvent.click(within(dialog).getByRole("button", { name: "Stay here" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });
});
