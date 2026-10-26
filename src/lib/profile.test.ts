import { describe, expect, it } from "vitest";
import { designScholarships } from "./content/design-data";
import { formatWhatsApp, matchesFor, parseWhatsApp, safeNext } from "./profile";

const scholarships = designScholarships();

describe("matchesFor", () => {
  it("matches everything with no plans", () => expect(matchesFor({ levels: [], disciplines: [], destinations: [] }, scholarships)).toHaveLength(26));
  it("filters by level, destination and discipline (open-to-all always matches)", () => {
    const ids = matchesFor({ levels: ["P"], disciplines: ["Law"], destinations: ["GB", "SG"] }, scholarships).map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(["gates", "clarendon"]));
    expect(ids).not.toContain("commonwealth"); // development subjects only, not Law
    expect(ids).not.toContain("singa"); // subject-specific, not Law
    expect(ids).not.toContain("chevening"); // Master's only
  });
});

describe("parseWhatsApp", () => {
  it("accepts Sri Lankan mobiles with or without the leading 0", () => {
    expect(parseWhatsApp("+94", "077 123 4567")).toEqual({ e164: "+94771234567" });
    expect(parseWhatsApp("+94", "77-123-4567")).toEqual({ e164: "+94771234567" });
  });
  it("rejects landlines and short numbers", () => {
    expect(parseWhatsApp("+94", "011 234 5678")).toEqual({ error: "Enter a valid Sri Lankan mobile number, e.g. 77 123 4567." });
    expect(parseWhatsApp("+44", "123")).toEqual({ error: "Enter a valid WhatsApp number." });
  });
  it("formats for display", () => expect(formatWhatsApp("+94771234567")).toBe("+94 77 123 4567"));
});

describe("safeNext", () => {
  it("allows relative paths only", () => {
    expect(safeNext("/scholarships?lv=P")).toBe("/scholarships?lv=P");
    expect(safeNext("//evil.com")).toBe("/account");
    expect(safeNext("https://evil.com")).toBe("/account");
    expect(safeNext("/\\evil.com")).toBe("/account");
    expect(safeNext(null, "/")).toBe("/");
  });
});
