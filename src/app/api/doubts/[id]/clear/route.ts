import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireUserContext } from "@/lib/api/request-context";
import { resolveDoubtRoomContext } from "@/lib/api/rooms";
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
    const roomContext = await resolveDoubtRoomContext(supabase, user.id, id);
    if (roomContext.error !== null) {
      return notFoundResponse("Doubt not found");
    }

    const room = roomContext.room;
    if (!room) {
      return notFoundResponse("Doubt not found");
    }

    const payload = clearDoubtSchema.parse(await request.json());

    const { data, error } = await supabase
      .from("doubts")
      .update({ is_cleared: payload.is_cleared })
      .eq("id", id)
      .select(
        "id,room_id,user_id,title,body_markdown,subject,subtopics,difficulty,error_tags,is_cleared,created_at,updated_at",
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
      room_id: room.id,
      doubt_id: id,
      is_cleared: payload.is_cleared,
    });

    return NextResponse.json({
      item: {
        id: data.id,
        room_id: data.room_id,
        created_by_user_id: data.user_id,
        title: data.title,
        body_markdown: data.body_markdown,
        subject: data.subject,
        subtopics: data.subtopics,
        difficulty: data.difficulty,
        error_tags: data.error_tags,
        is_cleared: data.is_cleared,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    });
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
