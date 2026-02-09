import { createCommentSchema } from "@/lib/validation/comment";

describe("comment validation", () => {
  it("accepts a valid comment", () => {
    const parsed = createCommentSchema.parse({
      body: "This explanation finally made sense.",
    });

    expect(parsed.body).toBe("This explanation finally made sense.");
  });

  it("rejects empty comment", () => {
    expect(() => createCommentSchema.parse({ body: "   " })).toThrow();
  });
});
