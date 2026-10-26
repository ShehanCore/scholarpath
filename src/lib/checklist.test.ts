import { describe, expect, it } from "vitest";
import {
  SECTIONS,
  blankChecklist,
  checklistStats,
  committeeRows,
  decodeShare,
  encodeShare,
  needsWork,
  prefill,
  visibleSections,
  type Checklist,
} from "./checklist";

const c = (patch: Partial<Checklist>): Checklist => ({ ...blankChecklist(), type: "scholarship", level: "M", ...patch });

describe("sections", () => {
  it("has A–I with 33 items", () => {
    expect(SECTIONS.map((s) => s.letter).join("")).toBe("ABCDEFGHI");
    expect(SECTIONS.reduce((n, s) => n + s.items.length, 0)).toBe(33);
  });
  it("shows Section F only for research grants, MPhil & Postgraduate, or PhD", () => {
    const has = (x: Partial<Checklist>) => visibleSections(c(x)).some((s) => s.letter === "F");
    expect(has({ type: "scholarship", level: "M" })).toBe(false);
    expect(has({ type: "scholarship", level: "B" })).toBe(false);
    expect(has({ type: "grant", level: "M" })).toBe(true);
    expect(has({ type: "scholarship", level: "R" })).toBe(true);
    expect(has({ type: "scholarship", level: "P" })).toBe(true);
  });
});

describe("checklistStats", () => {
  it("is Done ÷ applicable, excluding N/A; unanswered still counts", () => {
    // Master's scholarship: 23 items (no F).
    const s = checklistStats(c({ items: { A0: "done", A1: "done", A2: "na", A3: "needs" } }));
    expect(s.total).toBe(23);
    expect(s.answered).toBe(4);
    expect(s.needs).toBe(1);
    expect(s.pct).toBe(Math.round((2 / 22) * 100));
  });
  it("scores each quality the same way and labels missing qualities", () => {
    const fit = ["A0", "A1", "A2", "A3", "B0", "B1", "B2"];
    const s = checklistStats(c({ items: Object.fromEntries(fit.map((id, i) => [id, i < 5 ? "done" : "na"])) }));
    expect(s.bars.find((b) => b.quality === "Fit")).toEqual({ quality: "Fit", pct: 100, label: "100% · 5 of 5" });
    expect(s.bars.find((b) => b.quality === "Feasibility")?.label).toBe("Not part of this application");
    const allNa = checklistStats(c({ items: { H0: "na", H1: "na", H2: "na" } }));
    expect(allNa.bars.find((b) => b.quality === "Impact")?.label).toBe("All N/A");
  });
  it("ignores answers in Section F when F is hidden", () => {
    expect(checklistStats(c({ items: { F0: "done" } })).answered).toBe(0);
    expect(checklistStats(c({ level: "P", items: { F0: "done" } })).answered).toBe(1);
  });
  it("is 0% with nothing applicable", () => {
    const items = Object.fromEntries(visibleSections(c({})).flatMap((s) => s.items.map((it) => [it.id, "na" as const])));
    expect(checklistStats(c({ items })).pct).toBe(0);
  });
});

describe("needsWork", () => {
  it("lists items marked Needs work with where they are and notes", () => {
    const list = needsWork(c({ items: { D1: "needs", A0: "needs", B0: "done" }, notes: { D1: "Add one example" } }));
    expect(list.map((n) => n.id)).toEqual(["A0", "D1"]);
    expect(list[1].where).toBe("D · Personal statement / statement of purpose · Clarity");
    expect(list[1].note).toBe("Add one example");
  });
});

describe("prefill and committee", () => {
  it("prefills type and level from the scholarship", () => {
    expect(prefill({ awardType: "Research grant", levels: ["P"] })).toMatchObject({ type: "grant", level: "P" });
    expect(prefill({ awardType: "Scholarship", levels: ["M", "P"] })).toMatchObject({ type: "scholarship", level: "M" });
  });
  it("switches the committee column by application type", () => {
    expect(committeeRows("grant")[2]).toEqual({ factor: "Research originality", value: "Usually very important", strong: true });
    expect(committeeRows("scholarship")[2].value).toBe("Depends on the award");
  });
});

describe("share link", () => {
  it("round-trips and drops anything unknown", () => {
    const s = { scholarshipId: "chevening", ...c({ items: { A0: "done", D1: "needs", Z9: "done" } as Checklist["items"], notes: { D1: "Kandy → Colombo ✓" } }) };
    const decoded = decodeShare(encodeShare(s));
    expect(decoded).toEqual({ scholarshipId: "chevening", type: "scholarship", level: "M", items: { A0: "done", D1: "needs" }, notes: { D1: "Kandy → Colombo ✓" } });
    expect(encodeShare(s)).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it("rejects garbage", () => {
    expect(decodeShare("not-base64!!")).toBeNull();
    expect(decodeShare(btoa('{"v":2}'))).toBeNull();
  });
});
