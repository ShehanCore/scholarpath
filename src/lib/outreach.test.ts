import { describe, expect, it } from "vitest";
import {
  copyText,
  liveChecks,
  mailLinks,
  mergeOutreach,
  outreachTemplate,
  purposeAfterRecipientChange,
  trackerRow,
  type OutreachEntry,
} from "./outreach";

const chevening = { name: "Chevening Scholarships", closes: "2026-10-06", levels: ["M" as const] };
const base = {
  scholarship: chevening,
  to: "admissions" as const,
  purpose: "eligibility" as const,
  university: "UCL",
  name: "",
  paper: "",
  studentName: "Amaya Perera",
  studentEmail: "amaya@example.com",
};

describe("outreachTemplate", () => {
  it("writes an eligibility question with the closing date and leaves unknowns in brackets", () => {
    const t = outreachTemplate(base);
    expect(t.subject).toBe("Chevening Scholarships — eligibility question from a Sri Lankan applicant");
    expect(t.body).toContain("Dear Admissions and Scholarships team,");
    expect(t.body).toContain("closing 6 Oct 2026");
    expect(t.body).toContain("[your question]?");
    expect(t.body).toMatch(/Kind regards,\nAmaya Perera\namaya@example.com$/);
  });

  it("addresses a professor and their work", () => {
    const t = outreachTemplate({ ...base, to: "professor", purpose: "supervision", name: "Professor A. Fernando", paper: "coastal flooding" });
    expect(t.body.startsWith("Dear Professor A. Fernando,")).toBe(true);
    expect(t.body).toContain("I read your work on coastal flooding");
    expect(t.subject).toBe("Prospective Master's student: [research topic]");
  });

  it("follows up an earlier email", () => {
    const t = outreachTemplate({ ...base, purpose: "follow_up", ref: { subject: "Question", sentAt: "2026-10-01" } });
    expect(t.subject).toBe("Follow-up: Question");
    expect(t.body).toContain("I wrote to you on 1 Oct 2026");
  });

  it("uses a placeholder name when signed out", () => {
    expect(outreachTemplate({ ...base, studentName: "", studentEmail: "" }).body).toMatch(/Kind regards,\n\[Your name\]$/);
  });
});

describe("liveChecks", () => {
  it("fails the template until the placeholders are filled", () => {
    const checks = liveChecks(outreachTemplate(base).body, chevening.name, "admissions");
    expect(checks.map((c) => c.label)).toEqual([
      "Addressed to a named person or office",
      "Names the scholarship (Chevening)",
      "Asks one clear question",
      "No [placeholders] left to fill in",
      "No generic flattery",
      "Under 200 words",
    ]);
    expect(checks.find((c) => c.label.startsWith("No [placeholders]"))?.ok).toBe(false);
  });

  it("passes a finished email and adds the research check for professors", () => {
    const body =
      "Dear Professor Silva,\n\nI read your paper on coastal flooding. I plan to apply for the Chevening award. Are you accepting new students for 2027?\n\nKind regards,\nAmaya";
    const checks = liveChecks(body, chevening.name, "professor");
    expect(checks).toHaveLength(7);
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it("flags flattery, generic greetings and long emails", () => {
    const body = `Dear Sir/Madam, I humbly request ${"word ".repeat(200)}?`;
    const failed = liveChecks(body, chevening.name, "admissions").filter((c) => !c.ok).map((c) => c.label);
    expect(failed).toContain("Addressed to a named person or office");
    expect(failed).toContain("No generic flattery");
    expect(failed).toContain("Under 200 words");
  });
});

describe("mail links", () => {
  it("encodes subject and body for Gmail, Outlook and mailto", () => {
    const l = mailLinks(" office@ucl.ac.uk ", "A & B", "Line 1\nLine 2?");
    expect(l.gmail).toBe("https://mail.google.com/mail/?view=cm&fs=1&to=office%40ucl.ac.uk&su=A%20%26%20B&body=Line%201%0ALine%202%3F");
    expect(l.outlook).toContain("outlook.live.com/mail/0/deeplink/compose?to=office%40ucl.ac.uk&subject=A%20%26%20B");
    expect(l.mailto).toBe("mailto:office@ucl.ac.uk?subject=A%20%26%20B&body=Line%201%0ALine%202%3F");
  });

  it("copies the email as plain text", () => {
    expect(copyText("", "Hi", "Body")).toBe("Subject: Hi\n\nBody");
    expect(copyText("a@b.lk", "Hi", "Body")).toBe("To: a@b.lk\nSubject: Hi\n\nBody");
  });
});

it("keeps the purpose when switching recipient where it still applies", () => {
  expect(purposeAfterRecipientChange("professor", "eligibility")).toBe("supervision");
  expect(purposeAfterRecipientChange("international", "supervision")).toBe("eligibility");
  expect(purposeAfterRecipientChange("international", "follow_up")).toBe("follow_up");
});

describe("trackerRow", () => {
  const e = { purpose: "eligibility" as const, sentAt: "2026-10-22", status: "awaiting" as const };
  it("awaits a reply for 10 days, then a follow-up is due", () => {
    expect(trackerRow(e, "2026-10-26")).toEqual({
      chip: "Awaiting reply",
      tone: "neutral",
      meta: "Eligibility question · sent 22 Oct 2026 · follow up from 1 Nov",
      open: true,
    });
    expect(trackerRow(e, "2026-11-01")).toMatchObject({ chip: "Follow-up due", tone: "warning", meta: "Eligibility question · sent 22 Oct 2026 · no reply for 10 days" });
  });
  it("closes once replied or followed up", () => {
    expect(trackerRow({ ...e, status: "replied" }, "2026-12-01")).toMatchObject({ chip: "Replied", open: false, meta: "Eligibility question · sent 22 Oct 2026" });
    expect(trackerRow({ ...e, status: "followed_up" }, "2026-12-01")).toMatchObject({ chip: "Followed up", open: false });
  });
});

it("merges entries from two devices, keeping the later status", () => {
  const entry = (id: string, status: OutreachEntry["status"], sentAt = "2026-10-20"): OutreachEntry => ({
    id,
    scholarshipId: "chevening",
    to: "admissions",
    university: "UCL",
    name: "",
    email: "",
    purpose: "eligibility",
    subject: "Q",
    sentAt,
    status,
  });
  const merged = mergeOutreach([entry("a", "awaiting"), entry("b", "awaiting", "2026-10-25")], [entry("a", "replied"), entry("c", "awaiting", "2026-10-01")]);
  expect(merged.map((e) => [e.id, e.status])).toEqual([
    ["b", "awaiting"],
    ["a", "replied"],
    ["c", "awaiting"],
  ]);
});
