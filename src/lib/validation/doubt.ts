import { z } from "zod";

import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/constants";
import { uniqueTags } from "@/lib/doubts/normalize";

const tagSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .transform((value) => value.replace(/\s+/g, " "));

const titleSchema = z.string().trim().min(3).max(200);
const bodySchema = z.string().trim().min(1).max(50_000);
const subjectSchema = z.string().trim().min(1).max(120);
const roomIdSchema = z.uuid();

export const difficultySchema = z.enum(["easy", "medium", "hard"]);

export const createDoubtSchema = z.object({
  room_id: roomIdSchema.optional(),
  title: titleSchema,
  body_markdown: bodySchema,
  subject: subjectSchema,
  subtopics: z.array(tagSchema).max(20).default([]),
  difficulty: difficultySchema,
  error_tags: z.array(tagSchema).max(20).default([]),
  is_cleared: z.boolean().optional().default(false),
});

export const updateDoubtSchema = createDoubtSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export const clearDoubtSchema = z.object({
  is_cleared: z.boolean(),
});

export const attachmentPresignSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  mime_type: z.enum(ALLOWED_ATTACHMENT_MIME_TYPES),
  size_bytes: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
});

export const listDoubtsQuerySchema = z.object({
  room_id: roomIdSchema.optional(),
  q: z.string().trim().min(1).max(200).optional(),
  subject: z.string().trim().min(1).max(120).optional(),
  subtopic: z.string().trim().min(1).max(80).optional(),
  difficulty: difficultySchema.optional(),
  error_tag: z.string().trim().min(1).max(80).optional(),
  is_cleared: z.boolean().optional(),
  cursor: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export function parseListDoubtsQuery(searchParams: URLSearchParams) {
  const isClearedRaw = searchParams.get("is_cleared");

  return listDoubtsQuerySchema.parse({
    room_id: searchParams.get("room_id") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    subject: searchParams.get("subject") ?? undefined,
    subtopic: searchParams.get("subtopic") ?? undefined,
    difficulty: searchParams.get("difficulty") ?? undefined,
    error_tag: searchParams.get("error_tag") ?? undefined,
    is_cleared:
      isClearedRaw == null
        ? undefined
        : isClearedRaw === "true"
          ? true
          : isClearedRaw === "false"
            ? false
            : undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    limit: Number.parseInt(searchParams.get("limit") ?? "20", 10),
  });
}

export function normalizeCreateInput(
  payload: z.infer<typeof createDoubtSchema>,
): z.infer<typeof createDoubtSchema> {
  return {
    ...payload,
    subtopics: uniqueTags(payload.subtopics),
    error_tags: uniqueTags(payload.error_tags),
  };
}

export function normalizeUpdateInput(
  payload: z.infer<typeof updateDoubtSchema>,
): z.infer<typeof updateDoubtSchema> {
  return {
    ...payload,
    subtopics: payload.subtopics ? uniqueTags(payload.subtopics) : undefined,
    error_tags: payload.error_tags ? uniqueTags(payload.error_tags) : undefined,
  };
}
