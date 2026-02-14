import { createHash, randomBytes } from "node:crypto";

const INGEST_KEY_PREFIX = "doubtakey_live_";
const INGEST_KEY_TOKEN_BYTES = 24;
const INGEST_KEY_PREFIX_VISIBLE_CHARS = 22;

export function hashIngestApiKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function createIngestApiKey() {
  const token = randomBytes(INGEST_KEY_TOKEN_BYTES).toString("base64url");
  const apiKey = `${INGEST_KEY_PREFIX}${token}`;
  const keyHash = hashIngestApiKey(apiKey);
  const keyPrefix = apiKey.slice(0, INGEST_KEY_PREFIX_VISIBLE_CHARS);

  return {
    apiKey,
    keyHash,
    keyPrefix,
  };
}

export function parseIngestApiKeyHeader(headerValue: string | null) {
  if (!headerValue) {
    return null;
  }

  const value = headerValue.trim();
  if (!value) {
    return null;
  }

  return value;
}
