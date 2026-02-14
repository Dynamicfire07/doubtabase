import { createIngestApiKey, hashIngestApiKey, parseIngestApiKeyHeader } from "@/lib/auth/ingest-key";

describe("ingest key helpers", () => {
  it("creates a key and stable hash", () => {
    const first = createIngestApiKey();
    const second = createIngestApiKey();

    expect(first.apiKey).toMatch(/^doubtakey_live_/);
    expect(first.keyPrefix).toMatch(/^doubtakey_live_/);
    expect(first.keyHash).toBe(hashIngestApiKey(first.apiKey));
    expect(first.apiKey).not.toBe(second.apiKey);
  });

  it("parses header values", () => {
    expect(parseIngestApiKeyHeader("  abc  ")).toBe("abc");
    expect(parseIngestApiKeyHeader("")).toBeNull();
    expect(parseIngestApiKeyHeader(null)).toBeNull();
  });
});
