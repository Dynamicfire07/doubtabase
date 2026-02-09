import { NextResponse, type NextRequest } from "next/server";
import { ZodError, z } from "zod";

import { requireUserContext } from "@/lib/api/request-context";
import { resolveRoomContext } from "@/lib/api/rooms";
import {
  internalErrorResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import { SUPABASE_ATTACHMENTS_BUCKET } from "@/lib/constants";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const READ_CACHE_HEADERS = {
  "Cache-Control": "private, max-age=20, stale-while-revalidate=60",
  Vary: "Cookie, Authorization",
};

const metaQuerySchema = z.object({
  room_id: z.uuid(),
  include_suggestions: z.boolean().default(false),
  ids: z.array(z.uuid()).max(40).default([]),
});

function parseIncludeSuggestions(searchParams: URLSearchParams) {
  const value = (
    searchParams.get("include_suggestions") ?? ""
  ).trim().toLowerCase();
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
    const query = metaQuerySchema.parse({
      room_id: searchParams.get("room_id"),
      include_suggestions: parseIncludeSuggestions(searchParams),
      ids: searchParams.getAll("id"),
    });

    const roomContext = await resolveRoomContext(supabase, user.id, query.room_id);
    if (roomContext.error !== null) {
      return NextResponse.json({ error: roomContext.error }, { status: 404 });
    }

    const thumbnails = Object.fromEntries(
      query.ids.map((id) => [id, null] as const),
    ) as Record<string, string | null>;

    if (query.ids.length > 0) {
      const { data: attachmentRows, error: attachmentError } = await supabase
        .from("doubt_attachments")
        .select("doubt_id,storage_path,created_at")
        .in("doubt_id", query.ids)
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
      if (paths.length > 0) {
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
          thumbnails[doubtId] = signedByPath.get(path) ?? null;
        }
      }
    }

    let suggestions = {
      subjects: [] as string[],
      subtopics: [] as string[],
      error_tags: [] as string[],
    };

    if (query.include_suggestions) {
      const { data: suggestionRows, error: suggestionError } = await supabase
        .from("doubts")
        .select("subject,subtopics,error_tags")
        .eq("room_id", query.room_id)
        .order("updated_at", { ascending: false })
        .limit(80);

      if (suggestionError) {
        throw suggestionError;
      }

      suggestions = {
        subjects: Array.from(
          new Set(suggestionRows.map((row) => row.subject.trim()).filter(Boolean)),
        ).slice(0, 30),
        subtopics: Array.from(
          new Set(
            suggestionRows
              .flatMap((row) => row.subtopics)
              .map((value) => value.trim())
              .filter(Boolean),
          ),
        ).slice(0, 30),
        error_tags: Array.from(
          new Set(
            suggestionRows
              .flatMap((row) => row.error_tags)
              .map((value) => value.trim())
              .filter(Boolean),
          ),
        ).slice(0, 30),
      };
    }

    return NextResponse.json(
      {
        thumbnails,
        suggestions,
      },
      { headers: READ_CACHE_HEADERS },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    logError("api.doubts.meta_failed", {
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}
