import { z } from "zod";

const optionalCdnUrlString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (["null", "undefined", "none", "-"].includes(trimmed.toLowerCase())) {
    return undefined;
  }

  return trimmed;
}, z.string().optional());

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.url().optional(),
  // Optional CDN envs are parsed again in src/lib/cdn.ts; allow empty/placeholder values.
  NEXT_PUBLIC_ASSET_CDN_URL: optionalCdnUrlString,
  NEXT_PUBLIC_MEDIA_CDN_URL: optionalCdnUrlString,
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
  NEXT_PUBLIC_ASSET_CDN_URL: process.env.NEXT_PUBLIC_ASSET_CDN_URL,
  NEXT_PUBLIC_MEDIA_CDN_URL: process.env.NEXT_PUBLIC_MEDIA_CDN_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

export function hasSupabasePublicEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY),
  );
}
