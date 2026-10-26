import { describe, expect, it } from "vitest";
import { destinationStats } from "./derive";
import { designDestinations, designRankings, designScholarships, designUniversities } from "./design-data";
import { verificationChip } from "../verification";

const scholarships = designScholarships();
const universities = designUniversities();

describe("design data corrections", () => {
  it("never carries funding values", () => {
    for (const s of scholarships) {
      expect(s).not.toHaveProperty("funding");
      expect(s).not.toHaveProperty("covers");
    }
  });
  it("keeps funding amounts and coverage out of all prose", () => {
    const funding = /[€£$¥]|CHF|stipend|allowance|fee (waiver|remission|offset)|tuition|a month|a year:/i;
    for (const s of scholarships) {
      for (const text of [s.summary, s.deadlineNote, s.awards, s.whereUsable, ...(s.eligibility ?? []), ...(s.documents ?? [])]) {
        expect(text ?? "", s.id).not.toMatch(funding);
      }
    }
  });
  it("takes ranks from the brief, keeping display and sort apart", () => {
    const rankings = designRankings();
    expect(rankings).toHaveLength(20);
    expect(universities.find((u) => u.id === "ucl")).toMatchObject({ rankDisplay: "=17", rankSort: 17 });
    expect(universities.find((u) => u.id === "university-of-warwick")).toMatchObject({ rankDisplay: null, rankSort: null });
    expect(universities.find((u) => u.id === "mit")?.rankDisplay).toBeNull(); // not in the brief's rank list
    expect(rankings.every((r) => r.year === 2027 && r.source.startsWith("Times Higher Education"))).toBe(true);
  });
  it("links university scholarships to a known university", () => {
    expect(scholarships.find((s) => s.id === "pearson")?.universityId).toBe("university-of-toronto");
    expect(scholarships.find((s) => s.id === "chevening")?.universityId).toBeNull();
  });
  it("flags the records that need a human check", () => {
    const flagged = scholarships.filter((s) => s.humanCheckNote).map((s) => s.id).sort();
    expect(flagged).toEqual(["manaaki", "miu", "rtp", "singa", "swiss", "usneed"]);
  });
  it("only gives Chevening detail content", () => {
    const withDetail = scholarships.filter((s) => s.eligibility || s.documents || s.timeline).map((s) => s.id);
    expect(withDetail).toEqual(["chevening"]);
  });
  it("uses accent-free ids", () => {
    expect(universities.map((u) => u.id)).toContain("universite-de-montreal");
    expect(universities.every((u) => /^[a-z0-9-]+$/.test(u.id))).toBe(true);
  });
  it("has 18 destinations including Europe-wide", () => {
    const d = designDestinations();
    expect(d).toHaveLength(18);
    expect(d.at(-1)?.code).toBe("EU");
  });
});

describe("destinationStats", () => {
  it("computes counts from data and today's date", () => {
    // Chevening closed 6 Oct; Commonwealth closed 20 Oct; Gates and Clarendon are still open on 26 Oct 2026.
    const gb = destinationStats({ code: "GB" }, scholarships, universities, "2026-10-26");
    expect(gb).toEqual({ openScholarships: 2, rankedUniversities: 10, nextDeadline: "2026-12-08" });
    const unranked = universities.map((u) => ({ ...u, rankDisplay: null, rankSort: null }));
    expect(destinationStats({ code: "GB" }, scholarships, unranked, "2026-10-26").rankedUniversities).toBe(0);
  });
  it("reports no next deadline when everything has closed", () => {
    expect(destinationStats({ code: "GB" }, scholarships, universities, "2030-01-01").nextDeadline).toBeNull();
  });
});

describe("verificationChip", () => {
  const base = { lastVerified: "2026-10-22", humanCheckNote: null };
  it("shows the checked date in the verified tone", () =>
    expect(verificationChip({ ...base, verificationStatus: "checked" })).toEqual({
      tone: "verified",
      label: "Dates checked 22 Oct 2026",
    }));
  it("warns for expected dates", () =>
    expect(verificationChip({ ...base, verificationStatus: "expected_or_to_confirm" }).tone).toBe("warning"));
  it("warns while a human check is pending, even if dates were checked", () =>
    expect(verificationChip({ ...base, verificationStatus: "checked", humanCheckNote: "x" })).toEqual({
      tone: "warning",
      label: "Details to confirm",
    }));
  it("marks sample data", () =>
    expect(verificationChip({ ...base, verificationStatus: "sample" })).toEqual({ tone: "sample", label: "Sample data" }));
});
