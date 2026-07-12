import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getAuthRedirect, getProfileNameRedirect } from "@/lib/auth/routes";
import { getSupabaseConfig } from "@/lib/env";
import { hasProfileName } from "@/lib/profile/validation";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = Boolean(user);
  let redirectPath = getAuthRedirect(request.nextUrl.pathname, isAuthenticated);

  if (isAuthenticated && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    const profileHasName = hasProfileName(profile?.display_name);
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
