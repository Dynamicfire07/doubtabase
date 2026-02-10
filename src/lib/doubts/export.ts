import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const DOUBT_SELECT_COLUMNS =
  "id,room_id,user_id,title,body_markdown,subject,subtopics,difficulty,error_tags,is_cleared,created_at,updated_at";
const ATTACHMENT_SELECT_COLUMNS =
  "id,doubt_id,storage_path,mime_type,size_bytes,created_at";
const DEFAULT_PAGE_SIZE = 200;
const DEFAULT_MAX_DOUBTS = 5000;

export type ExportFilterDraft = {
  q: string;
  subject: string;
  is_cleared: "" | "true" | "false";
};

export type ExportFilter = {
  q?: string;
  subject?: string;
  is_cleared?: boolean;
};

export type ExportDoubtRow = {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  body_markdown: string;
  subject: string;
  subtopics: string[];
  difficulty: "easy" | "medium" | "hard";
  error_tags: string[];
  is_cleared: boolean;
  created_at: string;
  updated_at: string;
};

export type ExportAttachmentRow = {
  id: string;
  doubt_id: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

function sortDoubts(rows: ExportDoubtRow[]) {
  return [...rows].sort((a, b) => {
    if (a.created_at === b.created_at) {
      return b.id.localeCompare(a.id);
    }
    return b.created_at.localeCompare(a.created_at);
  });
}

function chunkList<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

export function normalizeExportFilter(
  draft: Partial<ExportFilterDraft> | undefined,
): ExportFilter {
  const q = typeof draft?.q === "string" ? draft.q.trim() : "";
  const subject = typeof draft?.subject === "string" ? draft.subject.trim() : "";
  const isClearedRaw =
    typeof draft?.is_cleared === "string" ? draft.is_cleared : "";

  return {
    q: q || undefined,
    subject: subject || undefined,
    is_cleared:
      isClearedRaw === ""
        ? undefined
        : isClearedRaw === "true"
          ? true
          : false,
  };
}

export async function fetchDoubtsForExport(
  supabase: SupabaseClient<Database>,
  roomId: string,
  filters: ExportFilter = {},
  options?: {
    pageSize?: number;
    maxRows?: number;
  },
) {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const maxRows = options?.maxRows ?? DEFAULT_MAX_DOUBTS;
  const rows: ExportDoubtRow[] = [];
  let from = 0;
  let truncated = false;

  while (true) {
    let query = supabase
      .from("doubts")
      .select(DOUBT_SELECT_COLUMNS)
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + pageSize - 1);

    if (filters.subject) {
      query = query.eq("subject", filters.subject);
    }

    if (filters.is_cleared !== undefined) {
      query = query.eq("is_cleared", filters.is_cleared);
    }

    if (filters.q) {
      query = query.textSearch("search_vector", filters.q, {
        config: "english",
        type: "websearch",
      });
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (data.length === 0) {
      break;
    }

    rows.push(...data);

    if (rows.length >= maxRows) {
      rows.splice(maxRows);
      truncated = true;
      break;
    }

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return {
    items: sortDoubts(rows),
    truncated,
  };
}

export async function fetchDoubtsByIdsForExport(
  supabase: SupabaseClient<Database>,
  roomId: string,
  doubtIds: string[],
) {
  const uniqueIds = Array.from(new Set(doubtIds));
  if (uniqueIds.length === 0) {
    return [] as ExportDoubtRow[];
  }

  const rows: ExportDoubtRow[] = [];
  const idChunks = chunkList(uniqueIds, 100);

  for (const idChunk of idChunks) {
    const { data, error } = await supabase
      .from("doubts")
      .select(DOUBT_SELECT_COLUMNS)
      .eq("room_id", roomId)
      .in("id", idChunk);

    if (error) {
      throw error;
    }

    rows.push(...data);
  }

  return sortDoubts(rows);
}

export async function fetchAttachmentsForExport(
  supabase: SupabaseClient<Database>,
  doubtIds: string[],
) {
  const uniqueIds = Array.from(new Set(doubtIds));
  if (uniqueIds.length === 0) {
    return [] as ExportAttachmentRow[];
  }

  const rows: ExportAttachmentRow[] = [];
  const idChunks = chunkList(uniqueIds, 100);

  for (const idChunk of idChunks) {
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from("doubt_attachments")
        .select(ATTACHMENT_SELECT_COLUMNS)
        .in("doubt_id", idChunk)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + DEFAULT_PAGE_SIZE - 1);

      if (error) {
        throw error;
      }

      if (data.length === 0) {
        break;
      }

      rows.push(...data);

      if (data.length < DEFAULT_PAGE_SIZE) {
        break;
      }

      from += DEFAULT_PAGE_SIZE;
    }
  }

  return rows.sort((a, b) => {
    if (a.created_at === b.created_at) {
      return a.id.localeCompare(b.id);
    }
    return a.created_at.localeCompare(b.created_at);
  });
}
