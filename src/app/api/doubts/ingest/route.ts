import { randomUUID } from "node:crypto";
import path from "node:path";

import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, z } from "zod";

import { requireUserContextFromRequest } from "@/lib/api/request-context";
import { resolveRoomContext } from "@/lib/api/rooms";
import {
  badRequestResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  hashIngestApiKey,
  parseIngestApiKeyHeader,
} from "@/lib/auth/ingest-key";
import { createDoubtInputFromIngest, decodeBase64Bytes } from "@/lib/doubts/ingest";
import {
  MAX_ATTACHMENT_BYTES,
  SUPABASE_ATTACHMENTS_BUCKET,
} from "@/lib/constants";
import { logError, logInfo, logWarn } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { ingestDoubtSchema, normalizeCreateInput } from "@/lib/validation/doubt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type IngestPayload = z.infer<typeof ingestDoubtSchema>;

type IngestAuthContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
  authMethod: "cookie" | "bearer" | "ingest_key";
};

type IngestAuthResult =
  | { context: IngestAuthContext; error: null }
  | { context: null; error: NextResponse };

const mimeToExtension: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

type PreparedAttachment = {
  bytes: Buffer;
  mimeType: string;
  sizeBytes: number;
  extension: string;
};

function getAttachmentExtension(filename: string | undefined, mimeType: string) {
  if (!filename) {
    return mimeToExtension[mimeType] ?? ".bin";
  }

  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpeg" || ext === ".jpg") {
    return ".jpg";
  }
  if (ext === ".png" || ext === ".webp") {
    return ext;
  }

  return mimeToExtension[mimeType] ?? ".bin";
}

function prepareAttachments(attachments: IngestPayload["attachments"]) {
  const items = attachments ?? [];

  return items.map((attachment, index): PreparedAttachment => {
    let bytes: Buffer;
    try {
      bytes = decodeBase64Bytes(attachment.data_base64);
    } catch {
      throw new Error(`Invalid base64 attachment at index ${index}`);
    }

    if (bytes.byteLength === 0) {
      throw new Error(`Attachment at index ${index} is empty`);
    }

    if (bytes.byteLength > MAX_ATTACHMENT_BYTES) {
      throw new Error(
        `Attachment at index ${index} exceeds max size of ${MAX_ATTACHMENT_BYTES} bytes`,
      );
    }

    return {
      bytes,
      mimeType: attachment.mime_type,
      sizeBytes: bytes.byteLength,
      extension: getAttachmentExtension(attachment.filename, attachment.mime_type),
    };
  });
}

async function resolveIngestAuthContext(
  request: NextRequest,
): Promise<IngestAuthResult> {
  const ingestKey = parseIngestApiKeyHeader(
    request.headers.get("x-ingest-key") ?? request.headers.get("x-api-key"),
  );

  if (ingestKey) {
    try {
      const admin = createSupabaseAdminClient();
      const keyHash = hashIngestApiKey(ingestKey);

      const { data: keyRow, error } = await admin
        .from("user_ingest_keys")
        .select("id,user_id,revoked_at")
        .eq("key_hash", keyHash)
        .maybeSingle();

      if (error || !keyRow || keyRow.revoked_at !== null) {
        return {
          context: null,
          error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
      }

      const { error: updateError } = await admin
        .from("user_ingest_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", keyRow.id);

      if (updateError) {
        logWarn("api.doubts.ingest.key_last_used_update_failed", {
          key_id: keyRow.id,
          user_id: keyRow.user_id,
          error: updateError.message,
        });
      }

      return {
        context: {
          supabase: admin,
          userId: keyRow.user_id,
          authMethod: "ingest_key",
        },
        error: null,
      };
    } catch {
      return {
        context: null,
        error: internalErrorResponse(),
      };
    }
  }

  const auth = await requireUserContextFromRequest(request);
  if (auth.error) {
    return {
      context: null,
      error: auth.error,
    };
  }

  const viaBearer = Boolean(request.headers.get("authorization")?.trim());

  return {
    context: {
      supabase: auth.context.supabase,
      userId: auth.context.user.id,
      authMethod: viaBearer ? "bearer" : "cookie",
    },
    error: null,
  };
}

async function rollbackIngestCreate(
  supabase: SupabaseClient<Database>,
  doubtId: string,
  uploadedPaths: string[],
) {
  if (uploadedPaths.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(SUPABASE_ATTACHMENTS_BUCKET)
      .remove(uploadedPaths);

    if (removeError) {
      logWarn("api.doubts.ingest.rollback.storage_remove_failed", {
        doubt_id: doubtId,
        error: removeError.message,
      });
    }
  }

  const { error: deleteAttachmentsError } = await supabase
    .from("doubt_attachments")
    .delete()
    .eq("doubt_id", doubtId);

  if (deleteAttachmentsError) {
    logWarn("api.doubts.ingest.rollback.attachment_delete_failed", {
      doubt_id: doubtId,
      error: deleteAttachmentsError.message,
    });
  }

  const { error: deleteDoubtError } = await supabase
    .from("doubts")
    .delete()
    .eq("id", doubtId);

  if (deleteDoubtError) {
    logWarn("api.doubts.ingest.rollback.doubt_delete_failed", {
      doubt_id: doubtId,
      error: deleteDoubtError.message,
    });
  }
}

function isUserPayloadError(error: Error) {
  return (
    error.message === "Invalid base64 payload" ||
    error.message.startsWith("Invalid base64 attachment at index ") ||
    error.message.includes("Attachment at index ") ||
    error.message.includes("max size")
  );
}

export async function POST(request: NextRequest) {
  let logUserId: string | null = null;

  try {
    const authResult = await resolveIngestAuthContext(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { supabase, userId, authMethod } = authResult.context;
    logUserId = userId;

    const payload = ingestDoubtSchema.parse(await request.json());
    const preparedAttachments = prepareAttachments(payload.attachments);
    const createPayload = createDoubtInputFromIngest(payload);
    const normalized = normalizeCreateInput(createPayload);

    const roomContext = await resolveRoomContext(supabase, userId);
    if (roomContext.error !== null) {
      return NextResponse.json({ error: roomContext.error }, { status: 404 });
    }

    if (!roomContext.room.is_personal) {
      return NextResponse.json(
        { error: "Personal room not found" },
        { status: 404 },
      );
    }

    const { data, error } = await supabase
      .from("doubts")
      .insert({
        ...normalized,
        user_id: userId,
        room_id: roomContext.room.id,
      })
      .select(
        "id,room_id,user_id,title,body_markdown,subject,subtopics,difficulty,error_tags,is_cleared,created_at,updated_at",
      )
      .single();

    if (error) {
      throw error;
    }

    const uploadedPaths: string[] = [];
    const attachments: Array<{
      id: string;
      doubt_id: string;
      storage_path: string;
      mime_type: string;
      size_bytes: number;
      created_at: string;
    }> = [];

    try {
      for (const attachment of preparedAttachments) {
        const objectPath = `rooms/${roomContext.room.id}/doubts/${data.id}/${randomUUID()}${attachment.extension}`;
        const { error: storageError } = await supabase.storage
          .from(SUPABASE_ATTACHMENTS_BUCKET)
          .upload(objectPath, attachment.bytes, {
            contentType: attachment.mimeType,
            upsert: false,
          });

        if (storageError) {
          throw storageError;
        }

        uploadedPaths.push(objectPath);

        const { data: attachmentRow, error: insertAttachmentError } = await supabase
          .from("doubt_attachments")
          .insert({
            doubt_id: data.id,
            storage_path: objectPath,
            mime_type: attachment.mimeType,
            size_bytes: attachment.sizeBytes,
          })
          .select("id,doubt_id,storage_path,mime_type,size_bytes,created_at")
          .single();

        if (insertAttachmentError) {
          throw insertAttachmentError;
        }

        attachments.push(attachmentRow);
      }
    } catch (attachmentError) {
      await rollbackIngestCreate(supabase, data.id, uploadedPaths);
      throw attachmentError;
    }

    logInfo("api.doubts.ingest.created", {
      user_id: userId,
      room_id: roomContext.room.id,
      doubt_id: data.id,
      attachment_count: attachments.length,
      auth_method: authMethod,
    });

    return NextResponse.json(
      {
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
        attachments,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    if (error instanceof Error && isUserPayloadError(error)) {
      return badRequestResponse(error.message);
    }

    logError("api.doubts.ingest.create_failed", {
      user_id: logUserId ?? "unknown",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}
