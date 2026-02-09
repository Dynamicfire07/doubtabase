import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireUserContext } from "@/lib/api/request-context";
import { resolveRoomContext } from "@/lib/api/rooms";
import { internalErrorResponse, validationErrorResponse } from "@/lib/api/response";
import { logError } from "@/lib/logger";
import { roomIdSchema } from "@/lib/validation/room";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const auth = await requireUserContext();
  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth.context;

  try {
    const { roomId } = await params;
    const room_id = roomIdSchema.parse(roomId);

    const roomContext = await resolveRoomContext(supabase, user.id, room_id);
    if (roomContext.error !== null) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const { data: members, error: membersError } = await supabase
      .from("room_members")
      .select("user_id,role,created_at")
      .eq("room_id", room_id)
      .order("created_at", { ascending: true });

    if (membersError) {
      throw membersError;
    }

    return NextResponse.json({
      items: members.map((member) => ({
        ...member,
        is_current_user: member.user_id === user.id,
      })),
      room: roomContext.room,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    logError("api.rooms.members_failed", {
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}
