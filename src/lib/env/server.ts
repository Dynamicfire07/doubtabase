import "server-only";

import { z } from "zod";

const schema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ATTACHMENTS_BUCKET: z.string().min(1).default("doubts-attachments"),
  SENTRY_DSN: z.string().optional(),
});

export const serverEnv = schema.parse({
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-service-role-key",
  SUPABASE_ATTACHMENTS_BUCKET: process.env.SUPABASE_ATTACHMENTS_BUCKET,
  SENTRY_DSN: process.env.SENTRY_DSN,
});

export function hasSupabaseServiceEnv() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
