import type { SupabaseClient } from "@supabase/supabase-js";

export async function saveProfileDisplayName(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  displayName: string,
): Promise<{ error: Error | null }> {
  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      email,
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { error: updateError };
  }

  if (!updated) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      email,
      display_name: displayName,
    });

    if (insertError) {
      return { error: insertError };
    }
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
    },
  });

  if (metadataError) {
    return { error: metadataError };
  }

  return { error: null };
}
