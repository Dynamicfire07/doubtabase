import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { hasSupabasePublicEnv, publicEnv } from "@/lib/env/public";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserContext = {
  supabase: SupabaseClient<Database>;
  user: User;
};

type UserContextResult =
  | { context: UserContext; error: null }
  | { context: null; error: NextResponse };

export async function requireUserContext(): Promise<UserContextResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      context: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    context: {
      supabase,
      user,
    },
    error: null,
  };
}

function parseBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(/\s+/, 2);

  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

async function requireBearerUserContext(
  request: NextRequest,
): Promise<UserContextResult> {
  const token = parseBearerToken(request);
  if (!token) {
    return {
      context: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!hasSupabasePublicEnv()) {
    return {
      context: null,
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    };
  }

  const supabase = createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      context: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    context: { supabase, user },
    error: null,
  };
}

export async function requireUserContextFromRequest(
  request: NextRequest,
): Promise<UserContextResult> {
  const token = parseBearerToken(request);
  if (token) {
    return requireBearerUserContext(request);
  }

  return requireUserContext();
}
