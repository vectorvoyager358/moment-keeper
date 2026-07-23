import { createClient } from "@/lib/supabase/server";
import {
  formatProfileName,
  getProfileNameFromMetadata,
  hasProfileName,
} from "@/lib/profile/validation";

export type UserProfile = {
  email: string;
  displayName: string;
  hasDisplayName: boolean;
};

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const email =
    typeof claims?.email === "string" ? claims.email.trim() : undefined;

  if (!claims?.sub || !email) {
    return null;
  }

  const metadataDisplayName = getProfileNameFromMetadata(claims.user_metadata);

  if (hasProfileName(metadataDisplayName)) {
    return {
      email,
      displayName: formatProfileName(metadataDisplayName),
      hasDisplayName: true,
    };
  }

  // Older accounts may not have display_name copied into auth metadata yet.
  // Only those accounts need the slower profile-table fallback.
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", claims.sub)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const displayName = formatProfileName(data?.display_name);

  return {
    email,
    displayName,
    hasDisplayName: hasProfileName(data?.display_name),
  };
}
