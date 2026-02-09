import { NextResponse } from "next/server";

import { requireUserContext } from "@/lib/api/request-context";
import { internalErrorResponse, notFoundResponse } from "@/lib/api/response";
import { SUPABASE_ATTACHMENTS_BUCKET } from "@/lib/constants";
import { logError, logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserContext();
  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth.context;
  const { id } = await params;

  try {
    const { data: attachment, error: attachmentError } = await supabase
      .from("doubt_attachments")
      .select("id,doubt_id,storage_path")
      .eq("id", id)
      .maybeSingle();

    if (attachmentError) {
      throw attachmentError;
    }

    if (!attachment) {
      return notFoundResponse("Attachment not found");
    }

    const { data: doubt, error: doubtError } = await supabase
      .from("doubts")
      .select("id")
      .eq("id", attachment.doubt_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (doubtError) {
      throw doubtError;
    }

    if (!doubt) {
      return notFoundResponse("Attachment not found");
    }

    const { error: storageError } = await supabase.storage
      .from(SUPABASE_ATTACHMENTS_BUCKET)
      .remove([attachment.storage_path]);

    if (storageError) {
      throw storageError;
    }

    const { error: deleteError } = await supabase
      .from("doubt_attachments")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    logInfo("api.attachments.deleted", {
      user_id: user.id,
      attachment_id: id,
      doubt_id: attachment.doubt_id,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logError("api.attachments.delete_failed", {
      user_id: user.id,
      attachment_id: id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}
