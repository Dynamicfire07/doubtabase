import { z } from "zod";

import { createDoubtSchema, ingestDoubtSchema } from "@/lib/validation/doubt";

const DEFAULT_TITLE = "OpenClaw Ingest";
const DEFAULT_SUBJECT = "OpenClaw";
const DEFAULT_DIFFICULTY = "medium";
const DEFAULT_BODY = "Ingested from OpenClaw.";
const BODY_TRUNCATION_SUFFIX = "\n\n[truncated]";

type IngestInput = z.infer<typeof ingestDoubtSchema>;

function normalizeBase64(raw: string) {
  const trimmed = raw.trim().replace(/^data:[^,]*;base64,/i, "");
  const withoutWhitespace = trimmed.replace(/\s+/g, "");
  const normalized = withoutWhitespace.replace(/-/g, "+").replace(/_/g, "/");

  if (!normalized || /[^A-Za-z0-9+/=]/.test(normalized)) {
    throw new Error("Invalid base64 payload");
  }

  const paddingLength = normalized.length % 4;
  if (paddingLength === 1) {
    throw new Error("Invalid base64 payload");
  }

  return paddingLength === 0
    ? normalized
    : `${normalized}${"=".repeat(4 - paddingLength)}`;
}

export function decodeBase64Bytes(raw: string) {
  const normalized = normalizeBase64(raw);
  return Buffer.from(normalized, "base64");
}

function normalizeTagList(values: string[] | undefined, limit = 20) {
  if (!values) {
    return undefined;
  }

  const normalized = values
    .map((value) => value.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .map((value) => value.slice(0, 80));

  return normalized.slice(0, limit);
}

function normalizeEndpoints(values: string[] | undefined) {
  if (!values) {
    return [];
  }

  const normalized = values
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.slice(0, 2_000));

  return Array.from(new Set(normalized)).slice(0, 50);
}

function normalizeText(value: string | undefined, maxLength: number) {
  if (!value) {
    return undefined;
  }

  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) {
    return undefined;
  }

  return cleaned.slice(0, maxLength);
}

function normalizeBodyText(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned || undefined;
}

function truncateBody(body: string) {
  if (body.length <= 50_000) {
    return body;
  }

  const keepLength = 50_000 - BODY_TRUNCATION_SUFFIX.length;
  return `${body.slice(0, Math.max(0, keepLength))}${BODY_TRUNCATION_SUFFIX}`;
}

function deriveTitle(text: string) {
  const line = text.split("\n")[0]?.trim() ?? "";
  const normalized = line.replace(/\s+/g, " ").slice(0, 200);

  if (normalized.length >= 3) {
    return normalized;
  }

  return DEFAULT_TITLE;
}

function buildBody(notes: string, endpoints: string[]) {
  const text = notes.trim();
  const base = text || DEFAULT_BODY;

  if (endpoints.length === 0) {
    return truncateBody(base);
  }

  const endpointLines = endpoints.map((endpoint) => `- ${endpoint}`).join("\n");
  return truncateBody(`${base}\n\n### Source Endpoints\n${endpointLines}`);
}

export function createDoubtInputFromIngest(
  input: IngestInput,
): z.infer<typeof createDoubtSchema> {
  const endpoints = normalizeEndpoints(input.endpoints);
  const notes = normalizeBodyText(input.notes);
  const body = buildBody(notes ?? "", endpoints);

  const title =
    normalizeText(input.title, 200) ??
    (notes ? deriveTitle(notes) : undefined) ??
    DEFAULT_TITLE;

  const subject = normalizeText(input.subject, 120) ?? DEFAULT_SUBJECT;
  const difficulty = input.difficulty ?? DEFAULT_DIFFICULTY;
  const subtopics = normalizeTagList(input.subtopics) ?? [];
  const errorTags = normalizeTagList(input.error_tags) ?? [];

  return createDoubtSchema.parse({
    title,
    body_markdown: body,
    subject,
    subtopics,
    difficulty,
    error_tags: errorTags,
    is_cleared: input.is_cleared ?? false,
  });
}
