import { createBrowserClient } from "@supabase/ssr";

import { hasSupabasePublicEnv, publicEnv } from "@/lib/env/public";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseBrowserClient() {
  if (!hasSupabasePublicEnv()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
