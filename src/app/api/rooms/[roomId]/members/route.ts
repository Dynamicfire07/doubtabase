import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireUserContext } from "@/lib/api/request-context";
import { resolveRoomContext } from "@/lib/api/rooms";
import { internalErrorResponse, validationErrorResponse } from "@/lib/api/response";
import { logError, logWarn } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { roomIdSchema } from "@/lib/validation/room";

export const dynamic = "force-dynamic";

const READ_CACHE_HEADERS = {
  "Cache-Control": "private, max-age=15, stale-while-revalidate=45",
  Vary: "Cookie, Authorization",
};

function extractFullName(userMetadata: unknown) {
  if (!userMetadata || typeof userMetadata !== "object") {
    return null;
  }

  const fullName = (userMetadata as { full_name?: unknown }).full_name;
  if (typeof fullName !== "string") {
    return null;
  }

  const trimmed = fullName.trim();
  return trimmed.length > 0 ? trimmed : null;
}

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

    const namesByUserId = new Map<string, string>();

    try {
      const admin = createSupabaseAdminClient();
      const uniqueUserIds = Array.from(new Set(members.map((member) => member.user_id)));

      const resolvedNames = await Promise.all(
        uniqueUserIds.map(async (memberUserId) => {
          const { data: memberUser, error: memberLookupError } =
            await admin.auth.admin.getUserById(memberUserId);

          if (memberLookupError) {
            logWarn("api.rooms.member_name_lookup_failed", {
              user_id: user.id,
              room_id,
              target_user_id: memberUserId,
              error: memberLookupError.message,
            });
            return null;
          }

          const fullName = extractFullName(memberUser.user?.user_metadata);
          if (!fullName) {
            return null;
          }

          return {
            user_id: memberUserId,
            name: fullName,
          };
        }),
      );

      for (const resolvedName of resolvedNames) {
        if (!resolvedName) {
          continue;
        }

        namesByUserId.set(resolvedName.user_id, resolvedName.name);
      }
    } catch (nameLookupError) {
      logWarn("api.rooms.member_name_lookup_unavailable", {
        user_id: user.id,
        room_id,
        error:
          nameLookupError instanceof Error
            ? nameLookupError.message
            : "Unknown error",
      });
    }

    return NextResponse.json({
      items: members.map((member) => ({
        ...member,
        name: namesByUserId.get(member.user_id) ?? null,
        is_current_user: member.user_id === user.id,
      })),
      room: roomContext.room,
    }, { headers: READ_CACHE_HEADERS });
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
