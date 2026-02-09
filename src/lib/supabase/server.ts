import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { hasSupabasePublicEnv, publicEnv } from "@/lib/env/public";
import type { Database } from "@/lib/supabase/database.types";

export async function createSupabaseServerClient() {
  if (!hasSupabasePublicEnv()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server components cannot always set cookies.
          }
        },
      },
    },
  );
}
