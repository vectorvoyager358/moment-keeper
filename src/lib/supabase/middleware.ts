import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getAuthRedirect, getProfileNameRedirect } from "@/lib/auth/routes";
import { getSupabaseConfig } from "@/lib/env";
import {
  getProfileNameFromMetadata,
  hasProfileName,
} from "@/lib/profile/validation";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseConfig();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  const isAuthenticated = Boolean(claims?.sub);
  let redirectPath = getAuthRedirect(request.nextUrl.pathname, isAuthenticated);

  if (isAuthenticated && claims?.sub) {
    let profileHasName = hasProfileName(
      getProfileNameFromMetadata(claims.user_metadata),
    );

    // Existing accounts may predate display_name being copied into auth
    // metadata. Only those accounts need the profile-table fallback.
    if (!profileHasName) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", claims.sub)
        .maybeSingle();

      profileHasName = hasProfileName(profile?.display_name);
    }

    const profileRedirect = getProfileNameRedirect(
      request.nextUrl.pathname,
      profileHasName,
    );

    if (profileRedirect) {
      redirectPath = profileRedirect;
    } else if (redirectPath === "/timeline" && !profileHasName) {
      redirectPath = "/settings?setup=1";
    }
  }

  if (redirectPath) {
    const url = request.nextUrl.clone();
    url.pathname = redirectPath;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
