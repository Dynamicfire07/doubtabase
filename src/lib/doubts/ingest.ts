import { z } from "zod";

import {
  createDoubtSchema,
  difficultySchema,
  ingestDoubtSchema,
} from "@/lib/validation/doubt";

const DEFAULT_TITLE = "OpenClaw Ingest";
const DEFAULT_SUBJECT = "OpenClaw";
const DEFAULT_DIFFICULTY = "medium";
const DEFAULT_BODY = "Ingested from OpenClaw.";
const BODY_TRUNCATION_SUFFIX = "\n\n[truncated]";

const decodedJsonSchema = z
  .object({
    title: z.string().optional(),
    subject: z.string().optional(),
    difficulty: z.string().optional(),
    subtopics: z.array(z.string()).optional(),
    error_tags: z.array(z.string()).optional(),
    endpoints: z.array(z.string()).optional(),
    is_cleared: z.boolean().optional(),
    body_markdown: z.string().optional(),
    body: z.string().optional(),
    message: z.string().optional(),
    content: z.string().optional(),
    text: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

type IngestInput = z.infer<typeof ingestDoubtSchema>;

type DecodedMetadata = {
  title?: string;
  subject?: string;
  difficulty?: z.infer<typeof difficultySchema>;
  subtopics?: string[];
  error_tags?: string[];
  endpoints?: string[];
  is_cleared?: boolean;
  message?: string;
};

function normalizeBase64(raw: string) {
  const trimmed = raw.trim().replace(/^data:[^,]*;base64,/i, "");
  const withoutWhitespace = trimmed.replace(/\s+/g, "");
  const normalized = withoutWhitespace.replace(/-/g, "+").replace(/_/g, "/");

  if (!normalized || /[^A-Za-z0-9+/=]/.test(normalized)) {
    throw new Error("Invalid base64 message");
  }

  const paddingLength = normalized.length % 4;
  if (paddingLength === 1) {
    throw new Error("Invalid base64 message");
  }

  return paddingLength === 0
    ? normalized
    : `${normalized}${"=".repeat(4 - paddingLength)}`;
}

export function decodeBase64Bytes(raw: string) {
  const normalized = normalizeBase64(raw);
  return Buffer.from(normalized, "base64");
}

export function decodeBase64Message(raw: string) {
  return decodeBase64Bytes(raw).toString("utf-8");
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

function deriveTitle(body: string) {
  const line = body.split("\n")[0]?.trim() ?? "";
  const normalized = line.replace(/\s+/g, " ").slice(0, 200);

  if (normalized.length >= 3) {
    return normalized;
  }

  return DEFAULT_TITLE;
}

function parseDecodedMetadata(decoded: string): DecodedMetadata {
  let parsed: unknown;

  try {
    parsed = JSON.parse(decoded);
  } catch {
    return {};
  }

  const result = decodedJsonSchema.safeParse(parsed);
  if (!result.success) {
    return {};
  }

  const obj = result.data;
  const difficulty = difficultySchema.safeParse(obj.difficulty);

  return {
    title: normalizeText(obj.title, 200),
    subject: normalizeText(obj.subject, 120),
    difficulty: difficulty.success ? difficulty.data : undefined,
    subtopics: normalizeTagList(obj.subtopics),
    error_tags: normalizeTagList(obj.error_tags),
    endpoints: normalizeEndpoints(obj.endpoints),
    is_cleared: obj.is_cleared,
    message:
      obj.body_markdown ??
      obj.body ??
      obj.notes ??
      obj.message ??
      obj.content ??
      obj.text,
  };
}

function buildBody(message: string, endpoints: string[]) {
  const text = message.trim();
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
  const decodedRaw = input.message_base64 ? decodeBase64Message(input.message_base64) : "";
  const decodedMetadata = decodedRaw.trim() ? parseDecodedMetadata(decodedRaw.trim()) : {};
  const endpoints = normalizeEndpoints(input.endpoints ?? decodedMetadata.endpoints);

  const message = normalizeBodyText(decodedMetadata.message ?? decodedRaw);
  const body = buildBody(message ?? "", endpoints);

  const title =
    normalizeText(input.title, 200) ??
    decodedMetadata.title ??
    (message ? deriveTitle(body) : undefined) ??
    DEFAULT_TITLE;

  const subject =
    normalizeText(input.subject, 120) ?? decodedMetadata.subject ?? DEFAULT_SUBJECT;

  const difficulty =
    input.difficulty ?? decodedMetadata.difficulty ?? DEFAULT_DIFFICULTY;

  const subtopics =
    normalizeTagList(input.subtopics) ?? decodedMetadata.subtopics ?? [];

  const errorTags =
    normalizeTagList(input.error_tags) ?? decodedMetadata.error_tags ?? [];

  return createDoubtSchema.parse({
    title,
    body_markdown: body,
    subject,
    subtopics,
    difficulty,
    error_tags: errorTags,
    is_cleared: input.is_cleared ?? decodedMetadata.is_cleared ?? false,
  });
}
