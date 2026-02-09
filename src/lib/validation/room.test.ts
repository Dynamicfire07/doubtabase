import { createRoomSchema, joinRoomSchema } from "@/lib/validation/room";

describe("room validation", () => {
  it("accepts valid room name", () => {
    const parsed = createRoomSchema.parse({
      name: "  Physics Group  ",
    });

    expect(parsed.name).toBe("Physics Group");
  });

  it("rejects empty room name", () => {
    expect(() =>
      createRoomSchema.parse({
        name: "   ",
      }),
    ).toThrow();
  });

  it("normalizes join code whitespace", () => {
    const parsed = joinRoomSchema.parse({
      code: " AB12 CD34 EF56 ",
    });

    expect(parsed.code).toBe("AB12CD34EF56");
  });
});
