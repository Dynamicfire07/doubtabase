function normalizeBaseUrl(value: string | undefined) {
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

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeAssetPath(path: string) {
  if (!path) {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

export function publicAssetUrl(path: string) {
  const base = normalizeBaseUrl(process.env.NEXT_PUBLIC_ASSET_CDN_URL);
  const assetPath = normalizeAssetPath(path);

  if (!base) {
    return assetPath;
  }

  const basePath = trimTrailingSlash(base.pathname);
  return `${base.origin}${basePath}${assetPath}`;
}

export function mediaCdnUrl(url: string | null | undefined) {
  if (!url) {
    return url ?? null;
  }

  const mediaBase = normalizeBaseUrl(process.env.NEXT_PUBLIC_MEDIA_CDN_URL);
  if (!mediaBase) {
    return url;
  }

  try {
    const source = new URL(url);
    const basePath = trimTrailingSlash(mediaBase.pathname);
    return `${mediaBase.origin}${basePath}${source.pathname}${source.search}${source.hash}`;
  } catch {
    return url;
  }
}

export function getCdnPreconnectOrigins() {
  const values = [
    process.env.NEXT_PUBLIC_ASSET_CDN_URL,
    process.env.NEXT_PUBLIC_MEDIA_CDN_URL,
  ];

  const origins = new Set<string>();
  for (const value of values) {
    const parsed = normalizeBaseUrl(value);
    if (parsed) {
      origins.add(parsed.origin);
    }
  }

  return Array.from(origins);
}
