import { tokenLoginSchema } from "@/lib/validation/auth";

describe("auth validation", () => {
  it("accepts valid token login payload", () => {
    const parsed = tokenLoginSchema.parse({
      email: "user@example.com",
      password: "secret",
    });

    expect(parsed.email).toBe("user@example.com");
    expect(parsed.password).toBe("secret");
  });

  it("rejects invalid email", () => {
    expect(() =>
      tokenLoginSchema.parse({
        email: "not-an-email",
        password: "secret",
      }),
    ).toThrow();
  });
});
