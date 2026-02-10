import { NextResponse, type NextRequest } from "next/server";
import { ZodError, z } from "zod";

import { requireUserContext } from "@/lib/api/request-context";
import { resolveRoomContext } from "@/lib/api/rooms";
import {
  internalErrorResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import { fetchDoubtsForExport } from "@/lib/doubts/export";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const READ_CACHE_HEADERS = {
  "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
  Vary: "Cookie, Authorization",
};

const exportCandidatesQuerySchema = z.object({
  room_id: z.uuid(),
});

export async function GET(request: NextRequest) {
  const auth = await requireUserContext();
  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth.context;

  try {
    const searchParams = new URL(request.url).searchParams;
    const query = exportCandidatesQuerySchema.parse({
      room_id: searchParams.get("room_id"),
    });

    const roomContext = await resolveRoomContext(supabase, user.id, query.room_id);
    if (roomContext.error !== null) {
      return NextResponse.json({ error: roomContext.error }, { status: 404 });
    }

    const { items, truncated } = await fetchDoubtsForExport(
      supabase,
      roomContext.room.id,
      {},
      {
        maxRows: 5000,
      },
    );

    return NextResponse.json(
      {
        room: roomContext.room,
        total: items.length,
        truncated,
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          subject: item.subject,
          difficulty: item.difficulty,
          is_cleared: item.is_cleared,
          updated_at: item.updated_at,
          created_at: item.created_at,
        })),
      },
      { headers: READ_CACHE_HEADERS },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    logError("api.doubts.export_candidates_failed", {
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}
