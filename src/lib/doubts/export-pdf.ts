import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import sharp from "sharp";

import { SUPABASE_ATTACHMENTS_BUCKET } from "@/lib/constants";
import type { ExportAttachmentRow, ExportDoubtRow } from "@/lib/doubts/export";
import type { Database } from "@/lib/supabase/database.types";

const PAGE_WIDTH = 595.28; // A4 width in points
const PAGE_HEIGHT = 841.89; // A4 height in points
const PAGE_MARGIN = 36;
const FOOTER_RESERVED = 20;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const MAX_IMAGE_HEIGHT = 240;

type BuildDoubtsPdfInput = {
  roomName: string;
  exportedBy: string;
  exportedAt: Date;
  selectionLabel: string;
  doubts: ExportDoubtRow[];
  attachmentsByDoubt: Map<string, ExportAttachmentRow[]>;
  supabase: SupabaseClient<Database>;
};

type EmbeddedAttachment = {
  width: number;
  height: number;
  imageBytes: Uint8Array;
};

type EmbeddedBrandLogo = {
  width: number;
  height: number;
  imageBytes: Uint8Array;
};

type PageState = {
  page: import("pdf-lib").PDFPage;
  y: number;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function wrapText(
  text: string,
  maxWidth: number,
  font: import("pdf-lib").PDFFont,
  fontSize: number,
) {
  const normalized = (text || "-").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const paragraphs = normalized.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const paragraphText = paragraph.trim();

    if (!paragraphText) {
      lines.push("");
      continue;
    }

    const words = paragraphText.split(/\s+/);
    let currentLine = words[0] ?? "";

    for (const word of words.slice(1)) {
      const candidate = `${currentLine} ${word}`;
      const candidateWidth = font.widthOfTextAtSize(candidate, fontSize);
      if (candidateWidth <= maxWidth) {
        currentLine = candidate;
        continue;
      }

      lines.push(currentLine);

      if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
        currentLine = word;
        continue;
      }

      let remainder = word;
      currentLine = "";

      while (remainder.length > 0) {
        let splitIndex = remainder.length;
        while (
          splitIndex > 1 &&
          font.widthOfTextAtSize(remainder.slice(0, splitIndex), fontSize) > maxWidth
        ) {
          splitIndex -= 1;
        }

        if (splitIndex <= 1) {
          splitIndex = 1;
        }

        const part = remainder.slice(0, splitIndex);
        remainder = remainder.slice(splitIndex);

        if (remainder.length === 0) {
          currentLine = part;
        } else {
          lines.push(part);
        }
      }
    }

    lines.push(currentLine);
  }

  return lines;
}

function drawWatermark(
  page: import("pdf-lib").PDFPage,
  watermarkFont: import("pdf-lib").PDFFont,
) {
  page.drawText("DOUBTABASE", {
    x: 72,
    y: PAGE_HEIGHT / 2 - 20,
    size: 54,
    font: watermarkFont,
    color: rgb(0.72, 0.72, 0.72),
    opacity: 0.15,
    rotate: degrees(32),
  });
}

function drawPageFooter(
  page: import("pdf-lib").PDFPage,
  bodyFont: import("pdf-lib").PDFFont,
  pageNumber: number,
  totalPages: number,
  brandLogo?: {
    image: import("pdf-lib").PDFImage;
    width: number;
    height: number;
  },
) {
  const brandText = "made with doubtabase | https://doubtabase.sbs/";
  const footerText = `Page ${pageNumber} of ${totalPages}`;
  const textWidth = bodyFont.widthOfTextAtSize(footerText, 9);

  page.drawLine({
    start: { x: PAGE_MARGIN, y: PAGE_MARGIN - 2 },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y: PAGE_MARGIN - 2 },
    thickness: 0.5,
    color: rgb(0.78, 0.78, 0.78),
  });

  page.drawText(footerText, {
    x: PAGE_WIDTH - PAGE_MARGIN - textWidth,
    y: 16,
    size: 9,
    font: bodyFont,
    color: rgb(0.36, 0.36, 0.36),
  });

  let brandX = PAGE_MARGIN;

  if (brandLogo) {
    page.drawImage(brandLogo.image, {
      x: brandX,
      y: 14,
      width: brandLogo.width,
      height: brandLogo.height,
    });
    brandX += brandLogo.width + 6;
  }

  page.drawText(brandText, {
    x: brandX,
    y: 16,
    size: 9,
    font: bodyFont,
    color: rgb(0.36, 0.36, 0.36),
  });
}

function buildTagText(values: string[]) {
  if (values.length === 0) {
    return "-";
  }

  return values.join(", ");
}

function scaleToFit(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
) {
  if (width <= 0 || height <= 0) {
    return { width: maxWidth, height: Math.min(120, maxHeight) };
  }

  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: width * ratio,
    height: height * ratio,
  };
}

async function loadAttachmentImage(
  supabase: SupabaseClient<Database>,
  storagePath: string,
) {
  const { data, error } = await supabase.storage
    .from(SUPABASE_ATTACHMENTS_BUCKET)
    .download(storagePath);

  if (error || !data) {
    return null;
  }

  const sourceBuffer = Buffer.from(await data.arrayBuffer());
  const pngBuffer = await sharp(sourceBuffer)
    .rotate()
    .png({ compressionLevel: 9 })
    .toBuffer();
  const metadata = await sharp(pngBuffer).metadata();

  if (!metadata.width || !metadata.height) {
    return null;
  }

  return {
    width: metadata.width,
    height: metadata.height,
    imageBytes: new Uint8Array(pngBuffer),
  } satisfies EmbeddedAttachment;
}

async function loadBrandLogoImage() {
  try {
    const logoPath = path.join(process.cwd(), "public", "brand-icon.svg");
    const svgBuffer = await readFile(logoPath);
    const pngBuffer = await sharp(svgBuffer)
      .resize(120, 120, { fit: "inside" })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const metadata = await sharp(pngBuffer).metadata();

    if (!metadata.width || !metadata.height) {
      return null;
    }

    return {
      width: metadata.width,
      height: metadata.height,
      imageBytes: new Uint8Array(pngBuffer),
    } satisfies EmbeddedBrandLogo;
  } catch {
    return null;
  }
}

export async function buildDoubtsExportPdf(
  input: BuildDoubtsPdfInput,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const brandLogoBytes = await loadBrandLogoImage();
  const embeddedBrandLogo = brandLogoBytes
    ? await pdfDoc.embedPng(brandLogoBytes.imageBytes)
    : null;

  const imageCache = new Map<string, Promise<EmbeddedAttachment | null>>();

  const getAttachmentImage = (storagePath: string) => {
    if (!imageCache.has(storagePath)) {
      imageCache.set(
        storagePath,
        loadAttachmentImage(input.supabase, storagePath).catch(() => null),
      );
    }
    return imageCache.get(storagePath)!;
  };

  const cover = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawWatermark(cover, titleFont);

  let coverY = PAGE_HEIGHT - PAGE_MARGIN;

  if (embeddedBrandLogo && brandLogoBytes) {
    const scaledLogo = scaleToFit(
      brandLogoBytes.width,
      brandLogoBytes.height,
      56,
      56,
    );
    cover.drawImage(embeddedBrandLogo, {
      x: PAGE_WIDTH - PAGE_MARGIN - scaledLogo.width,
      y: PAGE_HEIGHT - PAGE_MARGIN - scaledLogo.height + 4,
      width: scaledLogo.width,
      height: scaledLogo.height,
    });
  }

  cover.drawText("Doubts PDF Export", {
    x: PAGE_MARGIN,
    y: coverY,
    size: 22,
    font: titleFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  coverY -= 28;

  const coverLines = [
    `Room: ${input.roomName}`,
    `Selection: ${input.selectionLabel}`,
    `Total doubts: ${input.doubts.length}`,
    `Exported by: ${input.exportedBy}`,
    `Generated: ${input.exportedAt.toLocaleString()}`,
    "Order: newest created doubt first",
  ];

  for (const line of coverLines) {
    cover.drawText(line, {
      x: PAGE_MARGIN,
      y: coverY,
      size: 11,
      font: bodyFont,
      color: rgb(0.24, 0.24, 0.24),
    });
    coverY -= 16;
  }

  for (let index = 0; index < input.doubts.length; index += 1) {
    const doubt = input.doubts[index];
    const attachments = input.attachmentsByDoubt.get(doubt.id) ?? [];
    let continuation = 0;

    const startPage = () => {
      const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawWatermark(page, titleFont);

      const suffix = continuation > 0 ? ` (continued ${continuation})` : "";
      const heading = `Doubt ${index + 1} of ${input.doubts.length}${suffix}`;

      let y = PAGE_HEIGHT - PAGE_MARGIN;

      page.drawText(heading, {
        x: PAGE_MARGIN,
        y,
        size: 13,
        font: titleFont,
        color: rgb(0.16, 0.16, 0.16),
      });
      y -= 18;

      page.drawLine({
        start: { x: PAGE_MARGIN, y: y + 4 },
        end: { x: PAGE_WIDTH - PAGE_MARGIN, y: y + 4 },
        thickness: 0.8,
        color: rgb(0.78, 0.78, 0.78),
      });

      continuation += 1;
      return { page, y } satisfies PageState;
    };

    let pageState = startPage();

    const ensureSpace = (requiredHeight: number) => {
      if (pageState.y - requiredHeight >= PAGE_MARGIN + FOOTER_RESERVED) {
        return;
      }

      pageState = startPage();
    };

    const drawLabel = (label: string) => {
      ensureSpace(16);
      pageState.page.drawText(label, {
        x: PAGE_MARGIN,
        y: pageState.y - 14,
        size: 10,
        font: titleFont,
        color: rgb(0.24, 0.24, 0.24),
      });
      pageState.y -= 20;
    };

    const drawParagraph = (text: string, fontSize = 10, lineHeight = 13) => {
      const lines = wrapText(text, CONTENT_WIDTH, bodyFont, fontSize);
      for (const line of lines) {
        ensureSpace(lineHeight);
        pageState.page.drawText(line || " ", {
          x: PAGE_MARGIN,
          y: pageState.y - lineHeight + 2,
          size: fontSize,
          font: bodyFont,
          color: rgb(0.16, 0.16, 0.16),
        });
        pageState.y -= lineHeight;
      }
    };

    const titleLines = wrapText(doubt.title, CONTENT_WIDTH, titleFont, 16);
    for (const line of titleLines) {
      ensureSpace(20);
      pageState.page.drawText(line, {
        x: PAGE_MARGIN,
        y: pageState.y - 18,
        size: 16,
        font: titleFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      pageState.y -= 22;
    }

    ensureSpace(8);
    pageState.y -= 2;

    const metadataLines = [
      `Subject: ${doubt.subject || "-"}`,
      `Difficulty: ${doubt.difficulty} | Status: ${doubt.is_cleared ? "Cleared" : "Open"}`,
      `Subtopics: ${buildTagText(doubt.subtopics)}`,
      `Error tags: ${buildTagText(doubt.error_tags)}`,
      `Created: ${formatDateTime(doubt.created_at)}`,
      `Updated: ${formatDateTime(doubt.updated_at)}`,
      `Doubt ID: ${doubt.id}`,
    ];

    drawLabel("Metadata");
    for (const line of metadataLines) {
      drawParagraph(line, 10, 13);
    }

    drawLabel("Notes");
    drawParagraph(doubt.body_markdown || "-", 10, 13);

    drawLabel(`Attachments (${attachments.length})`);

    if (attachments.length === 0) {
      drawParagraph("No attachments.", 10, 13);
    } else {
      for (let attachmentIndex = 0; attachmentIndex < attachments.length; attachmentIndex += 1) {
        const attachment = attachments[attachmentIndex];
        const imagePayload = await getAttachmentImage(attachment.storage_path);

        if (!imagePayload) {
          drawParagraph(
            `Attachment ${attachmentIndex + 1}: unavailable (${attachment.mime_type})`,
            10,
            13,
          );
          continue;
        }

        const embeddedImage = await pdfDoc.embedPng(imagePayload.imageBytes);
        const scaled = scaleToFit(
          imagePayload.width,
          imagePayload.height,
          CONTENT_WIDTH,
          MAX_IMAGE_HEIGHT,
        );
        const blockHeight = scaled.height + 24;

        ensureSpace(blockHeight);

        const imageX = PAGE_MARGIN + (CONTENT_WIDTH - scaled.width) / 2;
        const imageTop = pageState.y - 6;
        const imageBottom = imageTop - scaled.height;

        pageState.page.drawImage(embeddedImage, {
          x: imageX,
          y: imageBottom,
          width: scaled.width,
          height: scaled.height,
        });

        pageState.y = imageBottom - 8;

        const caption = `Attachment ${attachmentIndex + 1} | ${attachment.mime_type}`;
        pageState.page.drawText(caption, {
          x: PAGE_MARGIN,
          y: pageState.y,
          size: 9,
          font: italicFont,
          color: rgb(0.36, 0.36, 0.36),
        });
        pageState.y -= 14;
      }
    }
  }

  const pages = pdfDoc.getPages();
  for (let index = 0; index < pages.length; index += 1) {
    drawPageFooter(
      pages[index],
      bodyFont,
      index + 1,
      pages.length,
      embeddedBrandLogo && brandLogoBytes
        ? {
            image: embeddedBrandLogo,
            ...scaleToFit(brandLogoBytes.width, brandLogoBytes.height, 10, 10),
          }
        : undefined,
    );
  }

  return pdfDoc.save();
}
