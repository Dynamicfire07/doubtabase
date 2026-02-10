import type { SupabaseClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";

import { buildDoubtsExportPdf } from "@/lib/doubts/export-pdf";
import type { ExportDoubtRow } from "@/lib/doubts/export";
import type { Database } from "@/lib/supabase/database.types";

const stubSupabase = {
  storage: {
    from() {
      return {
        async download() {
          return {
            data: null,
            error: {
              message: "Attachment unavailable",
            },
          };
        },
      };
    },
  },
} as unknown as SupabaseClient<Database>;

describe("buildDoubtsExportPdf", () => {
  it("creates a valid pdf for doubts without attachments", async () => {
    const doubt: ExportDoubtRow = {
      id: "11111111-1111-4111-8111-111111111111",
      room_id: "22222222-2222-4222-8222-222222222222",
      user_id: "33333333-3333-4333-8333-333333333333",
      title: "Why is product rule failing in this step?",
      body_markdown:
        "I used f'g + fg' but the sign in the second term keeps flipping. Need a clearer derivation.",
      subject: "Calculus",
      subtopics: ["Derivatives", "Product Rule"],
      difficulty: "medium",
      error_tags: ["Sign mistake"],
      is_cleared: false,
      created_at: "2026-01-11T10:15:00.000Z",
      updated_at: "2026-01-12T07:25:00.000Z",
    };

    const pdfBytes = await buildDoubtsExportPdf({
      roomName: "Test Room",
      exportedBy: "tester@example.com",
      exportedAt: new Date("2026-02-10T10:00:00.000Z"),
      selectionLabel: "Manual selection",
      doubts: [doubt],
      attachmentsByDoubt: new Map(),
      supabase: stubSupabase,
    });

    expect(pdfBytes.length).toBeGreaterThan(1000);

    const parsed = await PDFDocument.load(pdfBytes);
    expect(parsed.getPageCount()).toBe(2);
  });
});
