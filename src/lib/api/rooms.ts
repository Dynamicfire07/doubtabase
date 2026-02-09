import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { RoomRole } from "@/types/domain";

export type RoomContext = {
  id: string;
  name: string;
  is_personal: boolean;
  owner_user_id: string;
  role: RoomRole;
};

type RoomContextResult =
  | {
      room: RoomContext;
      error: null;
    }
  | {
      room: null;
      error: string;
    };

type DoubtRoomContextResult =
  | {
      room: RoomContext;
      error: null;
      doubt: {
        id: string;
        room_id: string;
        created_by_user_id: string;
      };
    }
  | {
      room: null;
      error: string;
      doubt: null;
    };

async function getRoomMembership(
  supabase: SupabaseClient<Database>,
  userId: string,
  roomId: string,
) {
  const { data: membership, error } = await supabase
    .from("room_members")
    .select("room_id,user_id,role")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !membership) {
    return null;
  }

  return membership;
}

async function getRoom(
  supabase: SupabaseClient<Database>,
  roomId: string,
) {
  const { data: room, error } = await supabase
    .from("rooms")
    .select("id,name,is_personal,owner_user_id")
    .eq("id", roomId)
    .maybeSingle();

  if (error || !room) {
    return null;
  }

  return room;
}

export async function getPersonalRoom(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data: room, error } = await supabase
    .from("rooms")
    .select("id,name,is_personal,owner_user_id")
    .eq("owner_user_id", userId)
    .eq("is_personal", true)
    .maybeSingle();

  if (error || !room) {
    return null;
  }

  return {
    ...room,
    role: "owner" as RoomRole,
  };
}

export async function resolveRoomContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  requestedRoomId?: string | null,
): Promise<RoomContextResult> {
  if (!requestedRoomId) {
    const personal = await getPersonalRoom(supabase, userId);

    if (!personal) {
      return {
        room: null,
        error: "Personal room not found",
      };
    }

    return {
      room: personal,
      error: null,
    };
  }

  const membership = await getRoomMembership(supabase, userId, requestedRoomId);

  if (!membership) {
    return {
      room: null,
      error: "Room not found",
    };
  }

  const room = await getRoom(supabase, requestedRoomId);

  if (!room) {
    return {
      room: null,
      error: "Room not found",
    };
  }

  return {
    room: {
      ...room,
      role: membership.role,
    },
    error: null,
  };
}

export async function resolveDoubtRoomContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  doubtId: string,
): Promise<DoubtRoomContextResult> {
  const { data: doubt, error } = await supabase
    .from("doubts")
    .select("id,room_id,user_id")
    .eq("id", doubtId)
    .maybeSingle();

  if (error || !doubt) {
    return {
      room: null,
      error: "Doubt not found",
      doubt: null,
    } as const;
  }

  const context = await resolveRoomContext(supabase, userId, doubt.room_id);
  if (context.error !== null) {
    return {
      room: null,
      error: "Doubt not found",
      doubt: null,
    } as const;
  }

  return {
    room: context.room,
    error: null,
    doubt: {
      id: doubt.id,
      room_id: doubt.room_id,
      created_by_user_id: doubt.user_id,
    },
  } as const;
}
