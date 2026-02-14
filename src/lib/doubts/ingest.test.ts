import { createDoubtInputFromIngest, decodeBase64Message } from "@/lib/doubts/ingest";

function toBase64(value: string) {
  return Buffer.from(value, "utf-8").toString("base64");
}

describe("doubt ingest helpers", () => {
  it("builds a create payload from plain base64 text", () => {
    const payload = createDoubtInputFromIngest({
      message_base64: toBase64("Need help with trigonometry identities"),
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

  it("extracts metadata when decoded payload is JSON", () => {
    const encoded = toBase64(
      JSON.stringify({
        title: "Webhook failure in worker",
        subject: "Backend",
        difficulty: "hard",
        subtopics: ["Queues", "Workers"],
        error_tags: ["Timeout"],
        message: "Worker retries keep failing after 60s.",
      }),
    );

    const payload = createDoubtInputFromIngest({
      message_base64: encoded,
    });

    expect(payload.title).toBe("Webhook failure in worker");
    expect(payload.subject).toBe("Backend");
    expect(payload.difficulty).toBe("hard");
    expect(payload.subtopics).toEqual(["Queues", "Workers"]);
    expect(payload.error_tags).toEqual(["Timeout"]);
    expect(payload.body_markdown).toBe("Worker retries keep failing after 60s.");
  });

  it("prefers explicit request fields over decoded JSON metadata", () => {
    const encoded = toBase64(
      JSON.stringify({
        title: "Old title",
        subject: "Old subject",
        difficulty: "hard",
        message: "Original body",
        endpoints: ["https://old.example.com"],
      }),
    );

    const payload = createDoubtInputFromIngest({
      message_base64: encoded,
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

  it("decodes base64 data URLs", () => {
    const decoded = decodeBase64Message("data:text/plain;base64,SGVsbG8=");
    expect(decoded).toBe("Hello");
  });

  it("throws on invalid base64", () => {
    expect(() =>
      createDoubtInputFromIngest({
        message_base64: "***not-base64***",
      }),
    ).toThrow("Invalid base64 message");
  });
});
