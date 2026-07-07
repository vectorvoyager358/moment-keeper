export const PUBLIC_ROUTES = ["/login", "/signup"] as const;

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function getAuthRedirect(
  pathname: string,
  isAuthenticated: boolean,
): string | null {
  if (!isAuthenticated && !isPublicRoute(pathname)) {
    return "/login";
  }

  if (isAuthenticated && isPublicRoute(pathname)) {
    return "/timeline";
  }

  return null;
}
