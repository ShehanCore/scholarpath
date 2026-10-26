import { describe, expect, it } from "vitest";
import { draftPrompt, parseDraft, parseDraftRequest } from "./ai-draft";

const chevening = { name: "Chevening Scholarships", funder: "UK government (FCDO)", levels: ["M" as const], closes: "2026-10-06" };

describe("parseDraftRequest", () => {
  it("keeps known values and trims long text", () => {
    const r = parseDraftRequest({ scholarshipId: "chevening", to: "professor", purpose: "supervision", notes: "x".repeat(2000), extra: 1 });
    expect(r).toMatchObject({ scholarshipId: "chevening", to: "professor", purpose: "supervision", university: "", name: "" });
    expect(r?.notes).toHaveLength(800);
  });
  it("rejects unknown recipients and purposes", () => {
    expect(parseDraftRequest({ scholarshipId: "chevening", to: "dean", purpose: "eligibility" })).toBeNull();
    expect(parseDraftRequest({ scholarshipId: "chevening", to: "admissions", purpose: "bribe" })).toBeNull();
    expect(parseDraftRequest(null)).toBeNull();
  });
});

describe("draftPrompt", () => {
  it("uses our scholarship record and fences what the student typed", () => {
    const r = parseDraftRequest({ scholarshipId: "chevening", to: "professor", purpose: "supervision", university: "UCL", name: "Prof. Silva", paper: "flood models" })!;
    const p = draftPrompt(r, chevening, "Amaya Perera");
    expect(p).toContain("Recipient: a professor / potential supervisor (Prof. Silva) at UCL.");
    expect(p).toContain("Scholarship: Chevening Scholarships (funder: UK government (FCDO); levels: Master's; closes 6 Oct 2026).");
    expect(p).toContain("Their research or a paper the student read: flood models.");
    expect(p.startsWith("<details>")).toBe(true);
  });
  it("omits the research line for offices", () => {
    const r = parseDraftRequest({ scholarshipId: "chevening", to: "admissions", purpose: "eligibility" })!;
    expect(draftPrompt(r, chevening, "")).not.toContain("Their research");
    expect(draftPrompt(r, chevening, "")).toContain("Student name: [Your name].");
  });
});

it("accepts only a subject and a non-empty body", () => {
  expect(parseDraft('{"subject":" Hi ","body":"Dear team,"}')).toEqual({ subject: "Hi", body: "Dear team," });
  expect(parseDraft('{"subject":"Hi","body":"  "}')).toBeNull();
  expect(parseDraft("not json")).toBeNull();
});
