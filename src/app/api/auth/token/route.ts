import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { internalErrorResponse, validationErrorResponse } from "@/lib/api/response";
import { hasSupabasePublicEnv, publicEnv } from "@/lib/env/public";
import { logError, logInfo } from "@/lib/logger";
import type { Database } from "@/lib/supabase/database.types";
import { tokenLoginSchema } from "@/lib/validation/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabasePublicEnv()) {
      return internalErrorResponse();
    }

    const payload = tokenLoginSchema.parse(await request.json());

    const supabase = createClient<Database>(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error || !data.user || !data.session) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    logInfo("api.auth.token.created", {
      user_id: data.user.id,
    });

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: data.session.token_type,
      expires_in: data.session.expires_in,
      expires_at: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email ?? null,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    logError("api.auth.token.failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}
