import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/env";

export function createClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();

  return createBrowserClient(url, anonKey);
}
