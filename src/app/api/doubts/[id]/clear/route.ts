import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireUserContext } from "@/lib/api/request-context";
import {
  internalErrorResponse,
  notFoundResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import { logError, logInfo } from "@/lib/logger";
import { clearDoubtSchema } from "@/lib/validation/doubt";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserContext();
  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth.context;
  const { id } = await params;

  try {
    const payload = clearDoubtSchema.parse(await request.json());

    const { data, error } = await supabase
      .from("doubts")
      .update({ is_cleared: payload.is_cleared })
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        "id,title,body_markdown,subject,subtopics,difficulty,error_tags,is_cleared,created_at,updated_at",
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return notFoundResponse("Doubt not found");
    }

    logInfo("api.doubts.clear_toggled", {
      user_id: user.id,
      doubt_id: id,
      is_cleared: payload.is_cleared,
    });

    return NextResponse.json({ item: data });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    logError("api.doubts.clear_failed", {
      user_id: user.id,
      doubt_id: id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}
