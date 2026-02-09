import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.url().optional(),
  NEXT_PUBLIC_ALLOWED_EMAIL: z.email().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

export const publicEnv = schema.parse({
  NEXT_PUBLIC_SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    "placeholder-anon-key",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_ALLOWED_EMAIL: process.env.NEXT_PUBLIC_ALLOWED_EMAIL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

export function hasSupabasePublicEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY),
  );
}
