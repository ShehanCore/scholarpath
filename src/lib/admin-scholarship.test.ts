import { describe, expect, it } from "vitest";
import { parseScholarshipForm, timelineToLines, toLines } from "./admin-scholarship";

function form(over: Record<string, string> = {}) {
  const f = new FormData();
  const base: Record<string, string> = {
    name: "Chevening Scholarships",
    opens: "2027-08-04",
    closes: "2027-10-06",
    deadline_note: "Closes at 12:00 UK time.",
    official_url: "https://www.chevening.org/",
    verification_status: "checked",
    last_verified: "2026-11-19",
    human_check_note: "",
    summary: "One-year master's in the UK.",
    awards: "",
    eligibility: "Sri Lankan citizen\n\n  Two years' work experience  ",
    documents: "",
    timeline: "Applications open | 4 Aug 2027\nResults | June 2028",
    where_usable: "",
    ...over,
  };
  for (const [k, v] of Object.entries(base)) f.set(k, v);
  return f;
}

describe("parseScholarshipForm", () => {
  it("turns the form into an update; empty sections become null (Not published)", () => {
    const r = parseScholarshipForm(form());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.update.eligibility).toEqual(["Sri Lankan citizen", "Two years' work experience"]);
    expect(r.update.documents).toBeNull();
    expect(r.update.human_check_note).toBeNull();
    expect(r.update.timeline).toEqual([
      { label: "Applications open", when: "4 Aug 2027" },
      { label: "Results", when: "June 2028" },
    ]);
  });

  it("checks dates, link and status", () => {
    const r = parseScholarshipForm(form({ opens: "2027-11-01", closes: "2027-10-06", official_url: "chevening.org", verification_status: "maybe", last_verified: "2026-02-30" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errors).sort()).toEqual(["closes", "last_verified", "official_url", "verification_status"]);
  });

  it("refuses funding amounts and coverage in any text", () => {
    for (const text of ["Covers tuition and flights.", "£18,000 a year", "Fully funded", "A monthly stipend", "Rs. 50,000"]) {
      const r = parseScholarshipForm(form({ summary: text }));
      expect(r.ok, text).toBe(false);
    }
    const r = parseScholarshipForm(form({ eligibility: "Apply by email\nUS$ 2,000 allowance" }));
    expect(!r.ok && r.errors.eligibility).toMatch(/funding/);
  });

  it("needs both parts of a timeline step", () => {
    const r = parseScholarshipForm(form({ timeline: "Interview" }));
    expect(!r.ok && r.errors.timeline).toBeTruthy();
  });
});

it("round-trips lists to textarea lines", () => {
  expect(toLines(["a", "b"])).toBe("a\nb");
  expect(toLines(null)).toBe("");
  expect(timelineToLines([{ label: "Open", when: "1 Aug" }])).toBe("Open | 1 Aug");
});

it("accepts every current scholarship unchanged, so each can be edited and saved", async () => {
  const { designScholarships } = await import("./content/design-data");
  for (const s of designScholarships()) {
    const f = new FormData();
    const fields: Record<string, string> = {
      name: s.name,
      opens: s.opens,
      closes: s.closes,
      deadline_note: s.deadlineNote ?? "",
      official_url: s.officialUrl,
      verification_status: s.verificationStatus,
      last_verified: s.lastVerified,
      human_check_note: s.humanCheckNote ?? "",
      summary: s.summary ?? "",
      awards: s.awards ?? "",
      eligibility: toLines(s.eligibility),
      documents: toLines(s.documents),
      timeline: timelineToLines(s.timeline),
      where_usable: s.whereUsable ?? "",
    };
    for (const [k, v] of Object.entries(fields)) f.set(k, v);
    const r = parseScholarshipForm(f);
    expect(r.ok ? "ok" : JSON.stringify(r.errors), s.id).toBe("ok");
  }
});
