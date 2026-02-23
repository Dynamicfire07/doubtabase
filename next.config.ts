import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

function normalizeUrl(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed);
  } catch {
    return null;
  }
}

function toRemotePattern(
  value: string | undefined,
): NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number] | null {
  const parsed = normalizeUrl(value);
  if (!parsed) {
    return null;
  }

  const basePath = parsed.pathname.replace(/\/+$/, "");
  return {
    protocol: parsed.protocol.replace(":", "") as "http" | "https",
    hostname: parsed.hostname,
    port: parsed.port,
    pathname: `${basePath || ""}/**`,
  };
}

const assetCdnUrl = normalizeUrl(process.env.NEXT_PUBLIC_ASSET_CDN_URL);
const remotePatterns = [
  toRemotePattern(process.env.NEXT_PUBLIC_SUPABASE_URL),
  toRemotePattern(process.env.NEXT_PUBLIC_ASSET_CDN_URL),
  toRemotePattern(process.env.NEXT_PUBLIC_MEDIA_CDN_URL),
].filter((value): value is NonNullable<typeof value> => value !== null);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  assetPrefix:
    process.env.NODE_ENV === "production" && assetCdnUrl
      ? assetCdnUrl.href.replace(/\/+$/, "")
      : undefined,
  images: {
    remotePatterns,
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
});
