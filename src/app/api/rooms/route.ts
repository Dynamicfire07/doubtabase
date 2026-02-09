import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireUserContext } from "@/lib/api/request-context";
import { internalErrorResponse, validationErrorResponse } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRoomSchema } from "@/lib/validation/room";

export const dynamic = "force-dynamic";

const READ_CACHE_HEADERS = {
  "Cache-Control": "private, max-age=20, stale-while-revalidate=60",
  Vary: "Cookie, Authorization",
};

function extractErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return "Unknown error";
}

export async function GET() {
  const auth = await requireUserContext();
  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth.context;

  try {
    const { data: memberships, error: membershipsError } = await supabase
      .from("room_members")
      .select("room_id,role")
      .eq("user_id", user.id);

    if (membershipsError) {
      throw membershipsError;
    }

    if (memberships.length === 0) {
      return NextResponse.json(
        { items: [], default_room_id: null },
        { headers: READ_CACHE_HEADERS },
      );
    }

    const roomIds = Array.from(new Set(memberships.map((row) => row.room_id)));

    const { data: rooms, error: roomsError } = await supabase
      .from("rooms")
      .select("id,name,is_personal,owner_user_id,created_at,updated_at")
      .in("id", roomIds);

    if (roomsError) {
      throw roomsError;
    }

    const { data: memberRows, error: memberRowsError } = await supabase
      .from("room_members")
      .select("room_id")
      .in("room_id", roomIds);

    if (memberRowsError) {
      throw memberRowsError;
    }

    const memberCounts = new Map<string, number>();
    for (const row of memberRows) {
      memberCounts.set(row.room_id, (memberCounts.get(row.room_id) ?? 0) + 1);
    }

    const roleByRoom = new Map<string, "owner" | "member">();
    for (const membership of memberships) {
      roleByRoom.set(membership.room_id, membership.role);
    }

    const items = rooms
      .map((room) => ({
        ...room,
        role: roleByRoom.get(room.id) ?? "member",
        member_count: memberCounts.get(room.id) ?? 0,
      }))
      .sort((a, b) => {
        if (a.is_personal && !b.is_personal) {
          return -1;
        }

        if (!a.is_personal && b.is_personal) {
          return 1;
        }

        return a.name.localeCompare(b.name);
      });

    const personal = items.find((item) => item.is_personal);

    return NextResponse.json({
      items,
      default_room_id: personal?.id ?? items[0]?.id ?? null,
    }, { headers: READ_CACHE_HEADERS });
  } catch (error) {
    logError("api.rooms.list_failed", {
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUserContext();
  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth.context;

  try {
    const payload = createRoomSchema.parse(await request.json());

    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({
        name: payload.name,
        is_personal: false,
        owner_user_id: user.id,
      })
      .select("id,name,is_personal,owner_user_id,created_at,updated_at")
      .single();

    if (roomError) {
      throw roomError;
    }

    let memberError: unknown = null;

    try {
      const admin = createSupabaseAdminClient();
      const { error } = await admin.from("room_members").upsert(
        {
          room_id: room.id,
          user_id: user.id,
          role: "owner",
        },
        {
          onConflict: "room_id,user_id",
          ignoreDuplicates: false,
        },
      );
      memberError = error;
    } catch {
      const fallback = await supabase.from("room_members").upsert(
        {
          room_id: room.id,
          user_id: user.id,
          role: "owner",
        },
        {
          onConflict: "room_id,user_id",
          ignoreDuplicates: false,
        },
      );
      memberError = fallback.error;
    }

    if (memberError) {
      try {
        const admin = createSupabaseAdminClient();
        await admin.from("rooms").delete().eq("id", room.id);
      } catch {
        await supabase.from("rooms").delete().eq("id", room.id);
      }

      throw memberError;
    }

    logInfo("api.rooms.created", {
      user_id: user.id,
      room_id: room.id,
    });

    return NextResponse.json(
      {
        item: {
          ...room,
          role: "owner",
          member_count: 1,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    logError("api.rooms.create_failed", {
      user_id: user.id,
      error: extractErrorMessage(error),
    });

    return internalErrorResponse();
  }
}
