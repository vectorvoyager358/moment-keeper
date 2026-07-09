export const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password"] as const;

/** PKCE callback must run without auth redirects interfering. */
export function isAuthCallbackRoute(pathname: string): boolean {
  return (
    pathname === "/auth/callback" || pathname.startsWith("/auth/callback/")
  );
}

/** Uptime monitors must reach health without a session. */
export function isPublicApiRoute(pathname: string): boolean {
  return pathname === "/api/health" || pathname.startsWith("/api/health/");
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * Only allow known in-app destinations after exchanging an auth code.
 * Prevents open redirects via a crafted `next` query param.
 */
export function getSafeAuthCallbackRedirect(next: string | null): string {
  if (next === "/reset-password") {
    return "/reset-password";
  }

  return "/timeline";
}

export function getAuthRedirect(
  pathname: string,
  isAuthenticated: boolean,
): string | null {
  if (isAuthCallbackRoute(pathname) || isPublicApiRoute(pathname)) {
    return null;
  }

  if (!isAuthenticated && !isPublicRoute(pathname)) {
    return "/login";
  }

  if (isAuthenticated && isPublicRoute(pathname)) {
    return "/timeline";
  }

  return null;
}
