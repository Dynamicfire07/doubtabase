import { NextResponse, type NextRequest } from "next/server";
import { ZodError, z } from "zod";

import { requireUserContext } from "@/lib/api/request-context";
import { resolveRoomContext } from "@/lib/api/rooms";
import {
  badRequestResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  fetchAttachmentsForExport,
  fetchDoubtsByIdsForExport,
  fetchDoubtsForExport,
  normalizeExportFilter,
  type ExportAttachmentRow,
} from "@/lib/doubts/export";
import { buildDoubtsExportPdf } from "@/lib/doubts/export-pdf";
import { logError, logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_EXPORT_DOUBTS = 1200;

const exportModeSchema = z.enum(["all", "manual", "filter"]);

const exportFilterDraftSchema = z.object({
  q: z.string().max(200).optional().default(""),
  subject: z.string().max(120).optional().default(""),
  is_cleared: z.enum(["", "true", "false"]).optional().default(""),
});

const exportPdfBodySchema = z
  .object({
    room_id: z.uuid(),
    mode: exportModeSchema,
    ids: z.array(z.uuid()).max(MAX_EXPORT_DOUBTS).optional(),
    filters: exportFilterDraftSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "manual" && (!value.ids || value.ids.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ids"],
        message: "Select at least one doubt for manual export.",
      });
    }
  });

function selectionLabelFromPayload(
  mode: z.infer<typeof exportModeSchema>,
  filters: ReturnType<typeof normalizeExportFilter>,
) {
  if (mode === "all") {
    return "All doubts in selected room";
  }

  if (mode === "manual") {
    return "Manual selection";
  }

  const filterBits: string[] = [];
  if (filters.q) {
    filterBits.push(`Search: "${filters.q}"`);
  }
  if (filters.subject) {
    filterBits.push(`Subject: "${filters.subject}"`);
  }
  if (filters.is_cleared !== undefined) {
    filterBits.push(`Status: ${filters.is_cleared ? "Cleared" : "Open"}`);
  }

  return filterBits.length > 0
    ? `Filter selection (${filterBits.join(" | ")})`
    : "Filter selection (all)";
}

function toFileSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function groupAttachmentsByDoubt(items: ExportAttachmentRow[]) {
  const map = new Map<string, ExportAttachmentRow[]>();

  for (const attachment of items) {
    const existing = map.get(attachment.doubt_id);
    if (existing) {
      existing.push(attachment);
    } else {
      map.set(attachment.doubt_id, [attachment]);
    }
  }

  return map;
}

async function loadDoubtsForPdf(
  supabase: Parameters<typeof fetchDoubtsForExport>[0],
  roomId: string,
  payload: z.infer<typeof exportPdfBodySchema>,
) {
  if (payload.mode === "manual") {
    const doubts = await fetchDoubtsByIdsForExport(supabase, roomId, payload.ids ?? []);
    return {
      items: doubts,
      truncated: false,
    };
  }

  const filters =
    payload.mode === "filter" ? normalizeExportFilter(payload.filters) : {};

  return fetchDoubtsForExport(supabase, roomId, filters, {
    maxRows: MAX_EXPORT_DOUBTS,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireUserContext();
  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth.context;

  try {
    const payload = exportPdfBodySchema.parse(await request.json());
    const roomContext = await resolveRoomContext(supabase, user.id, payload.room_id);

    if (roomContext.error !== null) {
      return NextResponse.json({ error: roomContext.error }, { status: 404 });
    }

    const { items: doubts, truncated } = await loadDoubtsForPdf(
      supabase,
      roomContext.room.id,
      payload,
    );

    if (truncated) {
      return badRequestResponse(
        `Export is limited to ${MAX_EXPORT_DOUBTS} doubts per request. Apply filters or manual selection.`,
      );
    }

    if (doubts.length === 0) {
      return badRequestResponse("No doubts matched the export selection.");
    }

    if (doubts.length > MAX_EXPORT_DOUBTS) {
      return badRequestResponse(
        `Export is limited to ${MAX_EXPORT_DOUBTS} doubts per request.`,
      );
    }

    const attachments = await fetchAttachmentsForExport(
      supabase,
      doubts.map((item) => item.id),
    );
    const attachmentsByDoubt = groupAttachmentsByDoubt(attachments);
    const normalizedFilters =
      payload.mode === "filter" ? normalizeExportFilter(payload.filters) : {};

    const exportedBy =
      (typeof user.user_metadata.full_name === "string"
        ? user.user_metadata.full_name.trim()
        : "") ||
      user.email ||
      `${user.id.slice(0, 8)}...${user.id.slice(-4)}`;

    const pdfBytes = await buildDoubtsExportPdf({
      roomName: roomContext.room.name,
      exportedBy,
      exportedAt: new Date(),
      selectionLabel: selectionLabelFromPayload(payload.mode, normalizedFilters),
      doubts,
      attachmentsByDoubt,
      supabase,
    });

    const safeRoomSlug = toFileSlug(roomContext.room.name) || "room";
    const datePart = new Date().toISOString().slice(0, 10);
    const filename = `doubts-${safeRoomSlug}-${datePart}.pdf`;
    const pdfBody = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength,
    ) as ArrayBuffer;

    logInfo("api.doubts.export_pdf_succeeded", {
      user_id: user.id,
      room_id: roomContext.room.id,
      doubt_count: doubts.length,
      attachment_count: attachments.length,
      mode: payload.mode,
    });

    return new NextResponse(pdfBody, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    logError("api.doubts.export_pdf_failed", {
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return internalErrorResponse();
  }
}
