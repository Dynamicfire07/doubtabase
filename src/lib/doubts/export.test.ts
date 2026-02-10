import { normalizeExportFilter } from "@/lib/doubts/export";

describe("doubt export helpers", () => {
  it("normalizes trimmed filter drafts", () => {
    const normalized = normalizeExportFilter({
      q: "  product rule  ",
      subject: "  Calculus ",
      is_cleared: "false",
    });

    expect(normalized).toEqual({
      q: "product rule",
      subject: "Calculus",
      is_cleared: false,
    });
  });

  it("drops empty values while preserving cleared=true", () => {
    const normalized = normalizeExportFilter({
      q: "   ",
      subject: "",
      is_cleared: "true",
    });

    expect(normalized).toEqual({
      q: undefined,
      subject: undefined,
      is_cleared: true,
    });
  });
});
