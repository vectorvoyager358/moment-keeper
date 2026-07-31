export type MomentBackContext = {
  href: string;
  label: string;
};

export function getMomentBackContext(
  value: string | string[] | undefined,
): MomentBackContext {
  const from = typeof value === "string" ? value : "";
  const isLookBackPath =
    from === "/browse" ||
    from.startsWith("/browse?") ||
    from.startsWith("/browse#");

  return isLookBackPath
    ? { href: from, label: "Back to Look Back" }
    : { href: "/timeline", label: "Back to your journal" };
}
