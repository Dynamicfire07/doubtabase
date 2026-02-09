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
import { createCommentSchema } from "@/lib/validation/comment";

export const dynamic = "force-dynamic";

export async function POST(
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

    const payload = createCommentSchema.parse(await request.json());

    const { data, error } = await supabase
      .from("doubt_comments")
      .insert({
        doubt_id: id,
        user_id: user.id,
        body: payload.body,
      })
      .select("id,doubt_id,user_id,body,created_at")
      .single();

    if (error) {
      throw error;
    }

    logInfo("api.doubts.comments.created", {
      user_id: user.id,
      room_id: roomContext.room.id,
      doubt_id: id,
      comment_id: data.id,
    });

    return NextResponse.json(
      {
        item: {
          id: data.id,
          doubt_id: data.doubt_id,
          created_by_user_id: data.user_id,
          body: data.body,
          created_at: data.created_at,
          is_current_user: true,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    logError("api.doubts.comments.create_failed", {
      user_id: user.id,
      doubt_id: id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}
