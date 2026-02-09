import { createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireUserContext } from "@/lib/api/request-context";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import { logError, logInfo } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { joinRoomSchema } from "@/lib/validation/room";

export const dynamic = "force-dynamic";

function hashInviteCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: NextRequest) {
  const auth = await requireUserContext();
  if (auth.error) {
    return auth.error;
  }

  const { user } = auth.context;

  try {
    const payload = joinRoomSchema.parse(await request.json());
    const tokenHash = hashInviteCode(payload.code);

    const admin = createSupabaseAdminClient();

    const { data: invite, error: inviteError } = await admin
      .from("room_invites")
      .select("id,room_id")
      .eq("token_hash", tokenHash)
      .is("revoked_at", null)
      .maybeSingle();

    if (inviteError) {
      throw inviteError;
    }

    if (!invite) {
      return notFoundResponse("Invite code is invalid or expired");
    }

    const { data: room, error: roomError } = await admin
      .from("rooms")
      .select("id,is_personal")
      .eq("id", invite.room_id)
      .maybeSingle();

    if (roomError) {
      throw roomError;
    }

    if (!room || room.is_personal) {
      return badRequestResponse("Invite is not valid for this room");
    }

    const { error: membershipError } = await admin.from("room_members").upsert(
      {
        room_id: room.id,
        user_id: user.id,
        role: "member",
      },
      {
        onConflict: "room_id,user_id",
        ignoreDuplicates: true,
      },
    );

    if (membershipError) {
      throw membershipError;
    }

    logInfo("api.rooms.joined", {
      user_id: user.id,
      room_id: room.id,
      invite_id: invite.id,
    });

    return NextResponse.json({ room_id: room.id });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    logError("api.rooms.join_failed", {
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}
