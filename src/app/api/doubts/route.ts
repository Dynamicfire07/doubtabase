import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { requireUserContext } from "@/lib/api/request-context";
import { resolveRoomContext } from "@/lib/api/rooms";
import {
  internalErrorResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import { SUPABASE_ATTACHMENTS_BUCKET } from "@/lib/constants";
import { decodeDoubtCursor, encodeDoubtCursor } from "@/lib/doubts/cursor";
import { logError, logInfo, logWarn } from "@/lib/logger";
import { sendNewDoubtNotificationEmail } from "@/lib/notifications/doubt-email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createDoubtSchema,
  normalizeCreateInput,
  parseListDoubtsQuery,
} from "@/lib/validation/doubt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const READ_CACHE_HEADERS = {
  "Cache-Control": "private, max-age=15, stale-while-revalidate=45",
  Vary: "Cookie, Authorization",
};

function parseWithMeta(searchParams: URLSearchParams) {
  const value = (searchParams.get("with_meta") ?? "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export async function GET(request: NextRequest) {
  const auth = await requireUserContext();
  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth.context;

  try {
    const searchParams = new URL(request.url).searchParams;
    const query = parseListDoubtsQuery(searchParams);
    const withMeta = parseWithMeta(searchParams);
    const roomContext = await resolveRoomContext(supabase, user.id, query.room_id);

    if (roomContext.error !== null) {
      return NextResponse.json({ error: roomContext.error }, { status: 404 });
    }

    let dbQuery = supabase
      .from("doubts")
      .select(
        "id,room_id,user_id,title,body_markdown,subject,subtopics,difficulty,error_tags,is_cleared,created_at,updated_at",
      )
      .eq("room_id", roomContext.room.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(query.limit + 1);

    if (query.subject) {
      dbQuery = dbQuery.eq("subject", query.subject);
    }

    if (query.subtopic) {
      dbQuery = dbQuery.contains("subtopics", [query.subtopic]);
    }

    if (query.difficulty) {
      dbQuery = dbQuery.eq("difficulty", query.difficulty);
    }

    if (query.error_tag) {
      dbQuery = dbQuery.contains("error_tags", [query.error_tag]);
    }

    if (query.is_cleared !== undefined) {
      dbQuery = dbQuery.eq("is_cleared", query.is_cleared);
    }

    if (query.q) {
      dbQuery = dbQuery.textSearch("search_vector", query.q, {
        config: "english",
        type: "websearch",
      });
    }

    if (query.cursor) {
      let decoded: ReturnType<typeof decodeDoubtCursor>;

      try {
        decoded = decodeDoubtCursor(query.cursor);
      } catch {
        return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
      }

      dbQuery = dbQuery.lt("created_at", decoded.created_at);
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw error;
    }

    const hasMore = data.length > query.limit;
    const items = hasMore ? data.slice(0, query.limit) : data;
    const nextCursor = hasMore
      ? encodeDoubtCursor({
          created_at: items[items.length - 1].created_at,
          id: items[items.length - 1].id,
        })
      : null;

    if (!withMeta) {
      const serializedItems = items.map((item) => ({
        id: item.id,
        room_id: item.room_id,
        created_by_user_id: item.user_id,
        title: item.title,
        body_markdown: item.body_markdown,
        subject: item.subject,
        subtopics: item.subtopics,
        difficulty: item.difficulty,
        error_tags: item.error_tags,
        is_cleared: item.is_cleared,
        created_at: item.created_at,
        updated_at: item.updated_at,
        thumbnail_url_signed: null,
      }));

      return NextResponse.json(
        {
          items: serializedItems,
          room: roomContext.room,
          next_cursor: nextCursor,
          suggestions: {
            subjects: [],
            subtopics: [],
            error_tags: [],
          },
        },
        { headers: READ_CACHE_HEADERS },
      );
    }

    const suggestionsPromise = query.cursor
      ? Promise.resolve({
          data: [],
          error: null,
        })
      : supabase
          .from("doubts")
          .select("subject,subtopics,error_tags")
          .eq("room_id", roomContext.room.id)
          .order("updated_at", { ascending: false })
          .limit(80);

    const thumbnailsPromise = (async () => {
      const thumbnailByDoubtId = new Map<string, string | null>();

      if (items.length === 0) {
        return thumbnailByDoubtId;
      }

      const doubtIds = items.map((item) => item.id);
      const { data: attachmentRows, error: attachmentError } = await supabase
        .from("doubt_attachments")
        .select("doubt_id,storage_path,created_at")
        .in("doubt_id", doubtIds)
        .order("created_at", { ascending: false });

      if (attachmentError) {
        throw attachmentError;
      }

      const firstAttachmentByDoubt = new Map<string, string>();
      for (const row of attachmentRows) {
        if (!firstAttachmentByDoubt.has(row.doubt_id)) {
          firstAttachmentByDoubt.set(row.doubt_id, row.storage_path);
        }
      }

      const paths = Array.from(firstAttachmentByDoubt.values());
      if (paths.length === 0) {
        return thumbnailByDoubtId;
      }

      const { data: signedUrls, error: signedError } = await supabase.storage
        .from(SUPABASE_ATTACHMENTS_BUCKET)
        .createSignedUrls(paths, 60 * 10);

      if (signedError) {
        throw signedError;
      }

      const signedByPath = new Map<string, string | null>();
      for (const value of signedUrls) {
        if (value.path) {
          signedByPath.set(value.path, value.signedUrl ?? null);
        }
      }

      for (const [doubtId, path] of firstAttachmentByDoubt.entries()) {
        thumbnailByDoubtId.set(doubtId, signedByPath.get(path) ?? null);
      }

      return thumbnailByDoubtId;
    })();

    const [
      { data: suggestionRows, error: suggestionError },
      thumbnailByDoubtId,
    ] = await Promise.all([suggestionsPromise, thumbnailsPromise]);

    if (suggestionError) {
      throw suggestionError;
    }

    const subjects = Array.from(
      new Set(suggestionRows.map((row) => row.subject.trim()).filter(Boolean)),
    ).slice(0, 30);

    const subtopics = Array.from(
      new Set(
        suggestionRows
          .flatMap((row) => row.subtopics)
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ).slice(0, 30);

    const errorTags = Array.from(
      new Set(
        suggestionRows
          .flatMap((row) => row.error_tags)
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ).slice(0, 30);

    const serializedItems = items.map((item) => ({
      id: item.id,
      room_id: item.room_id,
      created_by_user_id: item.user_id,
      title: item.title,
      body_markdown: item.body_markdown,
      subject: item.subject,
      subtopics: item.subtopics,
      difficulty: item.difficulty,
      error_tags: item.error_tags,
      is_cleared: item.is_cleared,
      created_at: item.created_at,
      updated_at: item.updated_at,
      thumbnail_url_signed: thumbnailByDoubtId.get(item.id) ?? null,
    }));

    return NextResponse.json({
      items: serializedItems,
      room: roomContext.room,
      next_cursor: nextCursor,
      suggestions: {
        subjects,
        subtopics,
        error_tags: errorTags,
      },
    }, { headers: READ_CACHE_HEADERS });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    logError("api.doubts.list_failed", {
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
    const payload = createDoubtSchema.parse(await request.json());
    const roomContext = await resolveRoomContext(supabase, user.id, payload.room_id);

    if (roomContext.error !== null) {
      return NextResponse.json({ error: roomContext.error }, { status: 404 });
    }

    const normalized = normalizeCreateInput(payload);

    const { data, error } = await supabase
      .from("doubts")
      .insert({
        ...normalized,
        user_id: user.id,
        room_id: roomContext.room.id,
      })
      .select(
        "id,room_id,user_id,title,body_markdown,subject,subtopics,difficulty,error_tags,is_cleared,created_at,updated_at",
      )
      .single();

    if (error) {
      throw error;
    }

    logInfo("api.doubts.created", {
      user_id: user.id,
      room_id: roomContext.room.id,
      doubt_id: data.id,
    });

    if (!roomContext.room.is_personal) {
      try {
        const admin = createSupabaseAdminClient();

        const { data: memberRows, error: memberError } = await admin
          .from("room_members")
          .select("user_id")
          .eq("room_id", roomContext.room.id)
          .neq("user_id", user.id);

        if (memberError) {
          throw memberError;
        }

        const recipients = (
          await Promise.all(
            memberRows.map(async (member) => {
              const { data: memberUser, error: memberLookupError } =
                await admin.auth.admin.getUserById(member.user_id);

              if (memberLookupError || !memberUser.user?.email) {
                logWarn("api.doubts.notify.member_lookup_failed", {
                  user_id: user.id,
                  room_id: roomContext.room.id,
                  target_user_id: member.user_id,
                  error: memberLookupError?.message ?? "Missing email",
                });
                return null;
              }

              const fullName =
                typeof memberUser.user.user_metadata.full_name === "string"
                  ? memberUser.user.user_metadata.full_name.trim()
                  : "";

              return {
                email: memberUser.user.email,
                name: fullName || null,
              };
            }),
          )
        ).filter((recipient): recipient is { email: string; name: string | null } =>
          Boolean(recipient),
        );

        const uploaderName =
          typeof user.user_metadata.full_name === "string" &&
          user.user_metadata.full_name.trim()
            ? user.user_metadata.full_name.trim()
            : user.email ?? "A room member";

        const notification = await sendNewDoubtNotificationEmail({
          recipients,
          roomName: roomContext.room.name,
          roomId: roomContext.room.id,
          doubtId: data.id,
          doubtTitle: data.title,
          subject: data.subject,
          difficulty: data.difficulty,
          uploaderName,
          appBaseUrl: process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin,
        });

        logInfo("api.doubts.notify.sent", {
          user_id: user.id,
          room_id: roomContext.room.id,
          doubt_id: data.id,
          attempted: notification.attempted,
          accepted: notification.accepted,
          rejected: notification.rejected,
          skipped: notification.skipped,
        });
      } catch (notificationError) {
        logWarn("api.doubts.notify.failed", {
          user_id: user.id,
          room_id: roomContext.room.id,
          doubt_id: data.id,
          error:
            notificationError instanceof Error
              ? notificationError.message
              : "Unknown error",
        });
      }
    }

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
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    logError("api.doubts.create_failed", {
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}
