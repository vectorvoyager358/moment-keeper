export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
] as const;

/** Service worker and manifest must bypass auth redirects. */
export function isPwaSupportRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/serwist/") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/~offline"
  );
}

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

/** Settings (and password reset) stay reachable while profile name is missing. */
export function isProfileSetupExemptRoute(pathname: string): boolean {
  return (
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/reset-password" ||
    pathname.startsWith("/reset-password/")
  );
}

export function getProfileNameRedirect(
  pathname: string,
  hasDisplayName: boolean,
): string | null {
  if (hasDisplayName || isProfileSetupExemptRoute(pathname)) {
    return null;
  }

  return "/settings?setup=1";
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
  if (
    isAuthCallbackRoute(pathname) ||
    isPublicApiRoute(pathname) ||
    isPwaSupportRoute(pathname)
  ) {
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
