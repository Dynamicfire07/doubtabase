import { createDoubtInputFromIngest, decodeBase64Bytes } from "@/lib/doubts/ingest";

describe("doubt ingest helpers", () => {
  it("builds a create payload from notes text", () => {
    const payload = createDoubtInputFromIngest({
      notes: "Need help with trigonometry identities",
      endpoints: [
        " https://api.example.com/v1/messages ",
        "https://api.example.com/v1/messages",
      ],
    });

    expect(payload.title).toBe("Need help with trigonometry identities");
    expect(payload.subject).toBe("OpenClaw");
    expect(payload.difficulty).toBe("medium");
    expect(payload.body_markdown).toContain(
      "Need help with trigonometry identities",
    );
    expect(payload.body_markdown).toContain("### Source Endpoints");
    expect(payload.body_markdown).toContain("https://api.example.com/v1/messages");
    expect(payload.is_cleared).toBe(false);
  });

  it("uses explicit metadata fields", () => {
    const payload = createDoubtInputFromIngest({
      notes: "Original body",
      title: "New title",
      subject: "New subject",
      difficulty: "easy",
      subtopics: ["A"],
      error_tags: ["B"],
      endpoints: ["https://new.example.com"],
      is_cleared: true,
    });

    expect(payload.title).toBe("New title");
    expect(payload.subject).toBe("New subject");
    expect(payload.difficulty).toBe("easy");
    expect(payload.subtopics).toEqual(["A"]);
    expect(payload.error_tags).toEqual(["B"]);
    expect(payload.body_markdown).toContain("Original body");
    expect(payload.body_markdown).toContain("https://new.example.com");
    expect(payload.is_cleared).toBe(true);
  });

  it("creates default body when only attachments are provided", () => {
    const payload = createDoubtInputFromIngest({
      attachments: [
        {
          mime_type: "image/png",
          data_base64: "iVBORw0KGgoAAAANSUhEUgAAAAUA",
        },
      ],
    });

    expect(payload.title).toBe("OpenClaw Ingest");
    expect(payload.subject).toBe("OpenClaw");
    expect(payload.body_markdown).toBe("Ingested from OpenClaw.");
  });

  it("decodes base64 bytes for attachments", () => {
    const bytes = decodeBase64Bytes("data:image/png;base64,SGVsbG8=");
    expect(bytes.toString("utf-8")).toBe("Hello");
  });

  it("throws on invalid base64 payload", () => {
    expect(() => decodeBase64Bytes("***not-base64***")).toThrow(
      "Invalid base64 payload",
    );
  });
});
