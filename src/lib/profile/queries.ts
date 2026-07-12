import { createClient } from "@/lib/supabase/server";
import { formatProfileName, hasProfileName } from "@/lib/profile/validation";

export type UserProfile = {
  email: string;
  displayName: string;
  hasDisplayName: boolean;
};

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const displayName = formatProfileName(data?.display_name);

  return {
    email: user.email,
    displayName,
    hasDisplayName: hasProfileName(data?.display_name),
  };
}
