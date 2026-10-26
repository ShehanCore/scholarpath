import { describe, expect, it } from "vitest";
import { designScholarships, designUniversities } from "./content/design-data";
import { activeChips, applyFilters, blankFilters, filtersToQuery, parseFilters, sortResults } from "./finder";

const scholarships = designScholarships();
const universities = designUniversities();
const today = "2026-10-26";
const run = (q: string) => applyFilters(scholarships, universities, parseFilters(new URLSearchParams(q)), today).map((s) => s.id);

describe("parseFilters / filtersToQuery", () => {
  it("round-trips and drops defaults and junk", () => {
    const f = parseFilters(new URLSearchParams("lv=P,X&disc=law,nope&dest=gb&dl=7&sort=funded&q=%20gates%20"));
    expect(f).toEqual({ ...blankFilters, lv: ["P"], disc: ["law"], dest: ["GB"], q: "gates" });
    expect(filtersToQuery(f)).toBe("?lv=P&disc=law&dest=GB&q=gates");
    expect(filtersToQuery(blankFilters)).toBe("");
  });
  it("accepts the links Phase 3 pages use", () => {
    expect(parseFilters(new URLSearchParams("aw=Research+grant")).aw).toEqual(["Research grant"]);
    expect(parseFilters(new URLSearchParams("dl=30")).dl).toBe("30");
  });
});

describe("applyFilters", () => {
  it("returns everything with no filters, closed last", () => {
    const ids = run("");
    expect(ids).toHaveLength(26);
    expect(ids.slice(-3).sort()).toEqual(["chevening", "commonwealth", "daad"]);
  });
  it("matches any selected level", () => {
    expect(run("lv=B").every((id) => scholarships.find((s) => s.id === id)?.levels.includes("B"))).toBe(true);
  });
  it("includes open-to-all awards under every discipline", () => {
    const ids = run("disc=computer-science");
    expect(ids).toContain("chevening");
    expect(ids).toContain("singa");
    expect(ids).not.toContain("commonwealth");
  });
  it("filters by university: its own awards plus national ones in its country", () => {
    expect(run("uni=university-of-melbourne").sort()).toEqual(["ausawards", "mgrs", "miu", "rtp"]);
  });
  it("deadline range excludes closed and too-distant deadlines", () => {
    const ids = run("dl=30");
    expect(ids).toContain("rtp"); // closes 31 Oct
    expect(ids).not.toContain("chevening"); // closed
    expect(ids).not.toContain("gates"); // 8 Dec
  });
  it("searches name and funder", () => {
    expect(run("q=fcdo")).toEqual(["chevening"]);
  });
});

describe("sortResults by rank", () => {
  it("uses university and best-in-country ranks, unranked and closed last", () => {
    const pick = scholarships.filter((s) => ["pearson", "gates", "mgrs", "rtp", "fulbright", "chevening", "daad"].includes(s.id));
    // gates: Cambridge 5; mgrs: Melbourne =34; rtp: national AU, best AU = Melbourne 34, closes the same day as mgrs;
    // pearson: Toronto and fulbright: no US ranks → unranked, by date; chevening and daad are closed, so last.
    expect(sortResults(pick, universities, "rank", today).map((s) => s.id)).toEqual([
      "gates", "mgrs", "rtp", "pearson", "fulbright", "chevening", "daad",
    ]);
  });
});

describe("activeChips", () => {
  it("labels and removes each filter", () => {
    const f = { ...blankFilters, lv: ["M" as const], dest: ["GB"], dl: "30" };
    const chips = activeChips(f, { destinations: { GB: "United Kingdom" }, universities: {} });
    expect(chips.map((c) => c.label)).toEqual(["Master's", "United Kingdom", "Closes within 30 days"]);
    expect(chips[1].remove(f).dest).toEqual([]);
  });
});
