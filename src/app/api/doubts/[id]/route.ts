import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireUserContext } from "@/lib/api/request-context";
import { resolveDoubtRoomContext } from "@/lib/api/rooms";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import { SUPABASE_ATTACHMENTS_BUCKET } from "@/lib/constants";
import { logError, logInfo } from "@/lib/logger";
import {
  normalizeUpdateInput,
  updateDoubtSchema,
} from "@/lib/validation/doubt";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
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

    const { data: doubt, error: doubtError } = await supabase
      .from("doubts")
      .select(
        "id,room_id,user_id,title,body_markdown,subject,subtopics,difficulty,error_tags,is_cleared,created_at,updated_at",
      )
      .eq("id", id)
      .maybeSingle();

    if (doubtError) {
      throw doubtError;
    }

    if (!doubt) {
      return notFoundResponse("Doubt not found");
    }

    const { data: attachments, error: attachmentsError } = await supabase
      .from("doubt_attachments")
      .select("id,doubt_id,storage_path,mime_type,size_bytes,created_at")
      .eq("doubt_id", id)
      .order("created_at", { ascending: false });

    if (attachmentsError) {
      throw attachmentsError;
    }

    const signedMap = new Map<string, string | null>();

    if (attachments.length > 0) {
      const { data: signed, error: signedError } = await supabase.storage
        .from(SUPABASE_ATTACHMENTS_BUCKET)
        .createSignedUrls(
          attachments.map((item) => item.storage_path),
          60 * 10,
        );

      if (signedError) {
        throw signedError;
      }

      for (const value of signed) {
        if (value.path) {
          signedMap.set(value.path, value.signedUrl ?? null);
        }
      }
    }

    const serializedAttachments = attachments.map((attachment) => ({
      ...attachment,
      public_url_signed: signedMap.get(attachment.storage_path) ?? null,
    }));

    return NextResponse.json({
      item: {
        id: doubt.id,
        room_id: doubt.room_id,
        created_by_user_id: doubt.user_id,
        title: doubt.title,
        body_markdown: doubt.body_markdown,
        subject: doubt.subject,
        subtopics: doubt.subtopics,
        difficulty: doubt.difficulty,
        error_tags: doubt.error_tags,
        is_cleared: doubt.is_cleared,
        created_at: doubt.created_at,
        updated_at: doubt.updated_at,
      },
      room,
      attachments: serializedAttachments,
    });
  } catch (error) {
    logError("api.doubts.get_failed", {
      user_id: user.id,
      doubt_id: id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}

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

    const payload = updateDoubtSchema.parse(await request.json());
    const normalized = normalizeUpdateInput(payload);
    const safeUpdate = { ...normalized };
    delete safeUpdate.room_id;

    if (Object.keys(safeUpdate).length === 0) {
      return badRequestResponse("Provide at least one editable field to update");
    }

    const { data, error } = await supabase
      .from("doubts")
      .update(safeUpdate)
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

    logInfo("api.doubts.updated", {
      user_id: user.id,
      room_id: room.id,
      doubt_id: id,
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

    logError("api.doubts.update_failed", {
      user_id: user.id,
      doubt_id: id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}

export async function DELETE(
  _request: NextRequest,
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

    if (room.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: attachments, error: attachmentsError } = await supabase
      .from("doubt_attachments")
      .select("storage_path")
      .eq("doubt_id", id);

    if (attachmentsError) {
      throw attachmentsError;
    }

    if (attachments.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(SUPABASE_ATTACHMENTS_BUCKET)
        .remove(attachments.map((item) => item.storage_path));

      if (storageError) {
        throw storageError;
      }
    }

    const { error: deleteError } = await supabase
      .from("doubts")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    logInfo("api.doubts.deleted", {
      user_id: user.id,
      room_id: room.id,
      doubt_id: id,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logError("api.doubts.delete_failed", {
      user_id: user.id,
      doubt_id: id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}
