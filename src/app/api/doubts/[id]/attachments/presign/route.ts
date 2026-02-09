import { randomUUID } from "node:crypto";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireUserContext } from "@/lib/api/request-context";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  MAX_ATTACHMENTS_PER_DOUBT,
  SUPABASE_ATTACHMENTS_BUCKET,
} from "@/lib/constants";
import { logError, logInfo } from "@/lib/logger";
import { attachmentPresignSchema } from "@/lib/validation/doubt";

export const dynamic = "force-dynamic";

const mimeToExtension: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function getExtension(filename: string, mimeType: string) {
  const ext = path.extname(filename).toLowerCase();

  if (ext === ".jpeg" || ext === ".jpg") {
    return ".jpg";
  }

  if (ext === ".png" || ext === ".webp") {
    return ext;
  }

  return mimeToExtension[mimeType] ?? ".bin";
}

export async function POST(
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
    const payload = attachmentPresignSchema.parse(await request.json());

    const { data: doubt, error: doubtError } = await supabase
      .from("doubts")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (doubtError) {
      throw doubtError;
    }

    if (!doubt) {
      return notFoundResponse("Doubt not found");
    }

    const { count, error: countError } = await supabase
      .from("doubt_attachments")
      .select("id", { count: "exact", head: true })
      .eq("doubt_id", id);

    if (countError) {
      throw countError;
    }

    if ((count ?? 0) >= MAX_ATTACHMENTS_PER_DOUBT) {
      return badRequestResponse(
        `Only ${MAX_ATTACHMENTS_PER_DOUBT} images are allowed per doubt`,
      );
    }

    const extension = getExtension(payload.filename, payload.mime_type);
    const objectPath = `doubts/${user.id}/${id}/${randomUUID()}${extension}`;

    const { data: signedUploadData, error: signError } = await supabase.storage
      .from(SUPABASE_ATTACHMENTS_BUCKET)
      .createSignedUploadUrl(objectPath);

    if (signError || !signedUploadData) {
      throw signError ?? new Error("Could not create signed upload URL");
    }

    const { data: attachment, error: insertError } = await supabase
      .from("doubt_attachments")
      .insert({
        doubt_id: id,
        storage_path: objectPath,
        mime_type: payload.mime_type,
        size_bytes: payload.size_bytes,
      })
      .select("id,doubt_id,storage_path,mime_type,size_bytes,created_at")
      .single();

    if (insertError) {
      throw insertError;
    }

    logInfo("api.attachments.presigned", {
      user_id: user.id,
      doubt_id: id,
      attachment_id: attachment.id,
      storage_path: objectPath,
    });

    return NextResponse.json({
      upload: {
        signed_url: signedUploadData.signedUrl,
        token: signedUploadData.token,
        path: signedUploadData.path,
      },
      attachment,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    logError("api.attachments.presign_failed", {
      user_id: user.id,
      doubt_id: id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}
