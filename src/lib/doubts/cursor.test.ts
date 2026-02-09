import { decodeDoubtCursor, encodeDoubtCursor } from "@/lib/doubts/cursor";

describe("doubt cursor", () => {
  it("round-trips cursor values", () => {
    const encoded = encodeDoubtCursor({
      created_at: "2026-02-09T13:00:00.000Z",
      id: "11111111-1111-4111-8111-111111111111",
    });

    const decoded = decodeDoubtCursor(encoded);

    expect(decoded).toEqual({
      created_at: "2026-02-09T13:00:00.000Z",
      id: "11111111-1111-4111-8111-111111111111",
    });
  });

  it("throws on invalid payload", () => {
    const encoded = Buffer.from(
      JSON.stringify({ created_at: "not-a-date", id: "nope" }),
    ).toString("base64url");

    expect(() => decodeDoubtCursor(encoded)).toThrow();
  });
});
