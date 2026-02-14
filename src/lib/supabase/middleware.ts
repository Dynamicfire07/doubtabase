import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasSupabasePublicEnv, publicEnv } from "@/lib/env/public";
import type { Database } from "@/lib/supabase/database.types";

function hasSupabaseAuthCookies(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
}

export async function updateSession(request: NextRequest) {
  if (!hasSupabasePublicEnv()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  let response = NextResponse.next({ request });

  if (!hasSupabaseAuthCookies(request)) {
    return response;
  }

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  try {
    await supabase.auth.getUser();
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: unknown }).code ?? "")
        : "";

    if (code === "refresh_token_not_found") {
      const staleCookies = request.cookies
        .getAll()
        .filter((cookie) => cookie.name.startsWith("sb-"))
        .map((cookie) => cookie.name);

      for (const name of staleCookies) {
        request.cookies.delete(name);
        response.cookies.delete(name);
      }

      return response;
    }

    throw error;
  }

  return response;
}
