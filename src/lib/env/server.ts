import "server-only";

import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}, z.string().min(1).optional());

const schema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ATTACHMENTS_BUCKET: z.string().min(1).default("doubts-attachments"),
  SENTRY_DSN: z.string().optional(),
  LOCAL_ADMIN_EMAIL: optionalString,
  LOCAL_ADMIN_PASSWORD: optionalString,
  LOCAL_ADMIN_COOKIE_SECRET: optionalString,
  LOCAL_ADMIN_USER_ID: optionalString,
});

export const serverEnv = schema.parse({
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-service-role-key",
  SUPABASE_ATTACHMENTS_BUCKET: process.env.SUPABASE_ATTACHMENTS_BUCKET,
  SENTRY_DSN: process.env.SENTRY_DSN,
  LOCAL_ADMIN_EMAIL: process.env.LOCAL_ADMIN_EMAIL,
  LOCAL_ADMIN_PASSWORD: process.env.LOCAL_ADMIN_PASSWORD,
  LOCAL_ADMIN_COOKIE_SECRET: process.env.LOCAL_ADMIN_COOKIE_SECRET,
  LOCAL_ADMIN_USER_ID: process.env.LOCAL_ADMIN_USER_ID,
});

export function hasSupabaseServiceEnv() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
