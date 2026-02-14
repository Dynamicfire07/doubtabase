import { NextResponse, type NextRequest } from "next/server";

import { requireUserContextFromRequest } from "@/lib/api/request-context";
import { internalErrorResponse } from "@/lib/api/response";
import { createIngestApiKey } from "@/lib/auth/ingest-key";
import { logError, logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireUserContextFromRequest(request);
  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth.context;

  try {
    const { data, error } = await supabase
      .from("user_ingest_keys")
      .select("id,key_prefix,created_at,last_used_at")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      has_active_key: Boolean(data),
      key: data
        ? {
            id: data.id,
            prefix: data.key_prefix,
            created_at: data.created_at,
            last_used_at: data.last_used_at,
          }
        : null,
    });
  } catch (error) {
    logError("api.auth.ingest_key.get_failed", {
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return internalErrorResponse();
  }
}

export async function POST(_request: NextRequest) {
  const auth = await requireUserContextFromRequest(_request);
  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth.context;

  try {
    const revokedAt = new Date().toISOString();
    const { error: revokeError } = await supabase
      .from("user_ingest_keys")
      .update({ revoked_at: revokedAt })
      .eq("user_id", user.id)
      .is("revoked_at", null);

    if (revokeError) {
      throw revokeError;
    }

    const generated = createIngestApiKey();
    const { data, error } = await supabase
      .from("user_ingest_keys")
      .insert({
        user_id: user.id,
        key_hash: generated.keyHash,
        key_prefix: generated.keyPrefix,
      })
      .select("id,key_prefix,created_at,last_used_at")
      .single();

    if (error) {
      throw error;
    }

    logInfo("api.auth.ingest_key.rotated", {
      user_id: user.id,
      key_id: data.id,
    });

    return NextResponse.json(
      {
        api_key: generated.apiKey,
        key: {
          id: data.id,
          prefix: data.key_prefix,
          created_at: data.created_at,
          last_used_at: data.last_used_at,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    logError("api.auth.ingest_key.rotate_failed", {
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return internalErrorResponse();
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUserContextFromRequest(request);
  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth.context;

  try {
    const revokedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("user_ingest_keys")
      .update({ revoked_at: revokedAt })
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .select("id");

    if (error) {
      throw error;
    }

    logInfo("api.auth.ingest_key.revoked", {
      user_id: user.id,
      count: data.length,
    });

    return NextResponse.json({
      revoked: data.length > 0,
      revoked_count: data.length,
    });
  } catch (error) {
    logError("api.auth.ingest_key.revoke_failed", {
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return internalErrorResponse();
  }
}
