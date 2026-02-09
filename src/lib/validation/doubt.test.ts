import {
  createDoubtSchema,
  normalizeCreateInput,
  parseListDoubtsQuery,
} from "@/lib/validation/doubt";

describe("doubt validation", () => {
  it("accepts valid payload", () => {
    const parsed = createDoubtSchema.parse({
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

  it("parses query filters", () => {
    const params = new URLSearchParams({
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
