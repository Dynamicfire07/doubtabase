import { randomBytes, createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireUserContext } from "@/lib/api/request-context";
import {
  badRequestResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import { ROOM_INVITE_CODE_LENGTH } from "@/lib/constants";
import { logError, logInfo } from "@/lib/logger";
import { roomIdSchema } from "@/lib/validation/room";

export const dynamic = "force-dynamic";

function generateInviteCode() {
  return randomBytes(Math.ceil(ROOM_INVITE_CODE_LENGTH * 0.8))
    .toString("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, ROOM_INVITE_CODE_LENGTH);
}

function hashInviteCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(
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

    const { data: membership, error: membershipError } = await supabase
      .from("room_members")
      .select("role")
      .eq("room_id", room_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership || membership.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id,is_personal")
      .eq("id", room_id)
      .maybeSingle();

    if (roomError) {
      throw roomError;
    }

    if (!room || room.is_personal) {
      return badRequestResponse("Personal rooms do not support invite links");
    }

    const now = new Date().toISOString();

    const { error: revokeError } = await supabase
      .from("room_invites")
      .update({ revoked_at: now })
      .eq("room_id", room_id)
      .is("revoked_at", null);

    if (revokeError) {
      throw revokeError;
    }

    const code = generateInviteCode();
    const token_hash = hashInviteCode(code);

    const { data: invite, error: inviteError } = await supabase
      .from("room_invites")
      .insert({
        room_id,
        token_hash,
        created_by_user_id: user.id,
      })
      .select("id,room_id,created_at,revoked_at")
      .single();

    if (inviteError) {
      throw inviteError;
    }

    logInfo("api.rooms.invite_rotated", {
      user_id: user.id,
      room_id,
      invite_id: invite.id,
    });

    return NextResponse.json({
      item: {
        ...invite,
        code,
        is_revoked: false,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    logError("api.rooms.invite_rotate_failed", {
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}
