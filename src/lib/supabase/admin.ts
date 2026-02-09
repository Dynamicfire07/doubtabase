import "server-only";

import { createClient } from "@supabase/supabase-js";

import { hasSupabasePublicEnv, publicEnv } from "@/lib/env/public";
import { hasSupabaseServiceEnv, serverEnv } from "@/lib/env/server";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseAdminClient() {
  if (!hasSupabasePublicEnv() || !hasSupabaseServiceEnv()) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
