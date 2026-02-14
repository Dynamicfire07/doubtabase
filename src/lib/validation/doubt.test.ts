import {
  createDoubtSchema,
  ingestDoubtSchema,
  normalizeCreateInput,
  parseListDoubtsQuery,
} from "@/lib/validation/doubt";

describe("doubt validation", () => {
  it("accepts valid payload", () => {
    const parsed = createDoubtSchema.parse({
      room_id: "11111111-1111-4111-8111-111111111111",
      title: "Why is my derivative wrong?",
      body_markdown: "I applied product rule but signs seem wrong.",
      subject: "Calculus",
      subtopics: ["Derivatives", "Product Rule"],
      difficulty: "medium",
      error_tags: ["Sign mistake"],
      is_cleared: false,
    });

    expect(parsed.subject).toBe("Calculus");
    expect(parsed.difficulty).toBe("medium");
  });

  it("normalizes duplicate tags", () => {
    const normalized = normalizeCreateInput(
      createDoubtSchema.parse({
        title: "Question",
        body_markdown: "Body",
        subject: "Math",
        subtopics: [" Limits ", "Limits", "limits"],
        difficulty: "easy",
        error_tags: ["  Sign  mistake", "Sign mistake"],
      }),
    );

    expect(normalized.subtopics).toEqual(["Limits", "limits"]);
    expect(normalized.error_tags).toEqual(["Sign mistake"]);
  });

  it("rejects invalid difficulty", () => {
    expect(() =>
      createDoubtSchema.parse({
        title: "Question",
        body_markdown: "Body",
        subject: "Math",
        subtopics: [],
        difficulty: "insane",
        error_tags: [],
      }),
    ).toThrow();
  });

  it("parses ingest payload with optional fields", () => {
    const parsed = ingestDoubtSchema.parse({
      message_base64: "SGVsbG8=",
      title: "Webhook ping",
      subject: "APIs",
      subtopics: ["Integrations"],
      difficulty: "easy",
      error_tags: ["Timeout"],
      is_cleared: false,
      endpoints: ["https://api.example.com/v1/messages"],
    });

    expect(parsed.message_base64).toBe("SGVsbG8=");
    expect(parsed.difficulty).toBe("easy");
    expect(parsed.endpoints).toEqual(["https://api.example.com/v1/messages"]);
  });

  it("accepts attachment-only ingest payload", () => {
    const parsed = ingestDoubtSchema.parse({
      attachments: [
        {
          mime_type: "image/png",
          data_base64: "iVBORw0KGgoAAAANSUhEUgAAAAUA",
        },
      ],
    });

    expect(parsed.attachments?.length).toBe(1);
    expect(parsed.message_base64).toBeUndefined();
  });

  it("rejects ingest payload when message and attachments are both missing", () => {
    expect(() =>
      ingestDoubtSchema.parse({
        title: "Missing source",
      }),
    ).toThrow();
  });

  it("parses query filters", () => {
    const params = new URLSearchParams({
      room_id: "22222222-2222-4222-8222-222222222222",
      q: "product rule",
      subject: "Math",
      subtopic: "Derivatives",
      difficulty: "hard",
      error_tag: "Sign mistake",
      is_cleared: "false",
      limit: "15",
    });

    const parsed = parseListDoubtsQuery(params);

    expect(parsed).toMatchObject({
      room_id: "22222222-2222-4222-8222-222222222222",
      q: "product rule",
      subject: "Math",
      subtopic: "Derivatives",
      difficulty: "hard",
      error_tag: "Sign mistake",
      is_cleared: false,
      limit: 15,
    });
  });
});
