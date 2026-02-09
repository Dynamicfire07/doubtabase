import { z } from "zod";

const cursorSchema = z.object({
  created_at: z.string().datetime(),
  id: z.string().uuid(),
});

export type DoubtCursor = z.infer<typeof cursorSchema>;

export function encodeDoubtCursor(cursor: DoubtCursor) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeDoubtCursor(raw: string) {
  const decoded = Buffer.from(raw, "base64url").toString("utf-8");
  const parsed = JSON.parse(decoded);
  return cursorSchema.parse(parsed);
}
