import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireUserContextFromRequest } from "@/lib/api/request-context";
import { resolveRoomContext } from "@/lib/api/rooms";
import { internalErrorResponse, validationErrorResponse } from "@/lib/api/response";
import { createDoubtInputFromIngest } from "@/lib/doubts/ingest";
import { logError, logInfo } from "@/lib/logger";
import { ingestDoubtSchema, normalizeCreateInput } from "@/lib/validation/doubt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireUserContextFromRequest(request);
  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth.context;

  try {
    const payload = ingestDoubtSchema.parse(await request.json());
    const createPayload = createDoubtInputFromIngest(payload);
    const normalized = normalizeCreateInput(createPayload);

    const roomContext = await resolveRoomContext(supabase, user.id);

    if (roomContext.error !== null) {
      return NextResponse.json({ error: roomContext.error }, { status: 404 });
    }

    if (!roomContext.room.is_personal) {
      return NextResponse.json(
        { error: "Personal room not found" },
        { status: 404 },
      );
    }

    const { data, error } = await supabase
      .from("doubts")
      .insert({
        ...normalized,
        user_id: user.id,
        room_id: roomContext.room.id,
      })
      .select(
        "id,room_id,user_id,title,body_markdown,subject,subtopics,difficulty,error_tags,is_cleared,created_at,updated_at",
      )
      .single();

    if (error) {
      throw error;
    }

    logInfo("api.doubts.ingest.created", {
      user_id: user.id,
      room_id: roomContext.room.id,
      doubt_id: data.id,
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    if (error instanceof Error && error.message === "Invalid base64 message") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logError("api.doubts.ingest.create_failed", {
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}
