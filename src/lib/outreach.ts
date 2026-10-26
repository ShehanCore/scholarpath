// Email outreach to universities and professors (design/README.md "Outreach"). Pure functions: the
// template, the "Before you send" checks, the mail-app links and the tracker states. ScholarPath never
// sends email itself — these links open the student's own mail app.
import type { LevelCode, Scholarship, University } from "@/lib/content/types";
import { levelsText } from "@/lib/format";
import { formatDate } from "@/lib/verification";

export type Recipient = "admissions" | "international" | "professor";
export type Purpose = "eligibility" | "supervision" | "follow_up";
export type OutreachStatus = "awaiting" | "replied" | "followed_up";

/** One logged email. `id` is made on the device so the same entry can be matched across devices. */
export type OutreachEntry = {
  id: string;
  scholarshipId: string;
  to: Recipient;
  university: string;
  name: string;
  email: string;
  purpose: Purpose;
  subject: string;
  /** ISO date the student opened it in their mail app. */
  sentAt: string;
  status: OutreachStatus;
};

export const FOLLOW_UP_DAYS = 10;

export const RECIPIENTS: { value: Recipient; label: string }[] = [
  { value: "admissions", label: "Admissions & scholarships" },
  { value: "international", label: "International office" },
  { value: "professor", label: "Professor / supervisor" },
];

export function purposesFor(to: Recipient): { value: Purpose; label: string }[] {
  return to === "professor"
    ? [
        { value: "supervision", label: "Ask about supervision" },
        { value: "eligibility", label: "Ask about eligibility" },
        { value: "follow_up", label: "Follow up an earlier email" },
      ]
    : [
        { value: "eligibility", label: "Ask about eligibility or requirements" },
        { value: "follow_up", label: "Follow up an earlier email" },
      ];
}

/** Switching recipient keeps the purpose when it still applies (the prototype's rule). */
export function purposeAfterRecipientChange(to: Recipient, purpose: Purpose): Purpose {
  if (to === "professor") return "supervision";
  return purpose === "supervision" ? "eligibility" : purpose;
}

export type Draft = {
  scholarship: Pick<Scholarship, "name" | "closes" | "levels">;
  to: Recipient;
  purpose: Purpose;
  university: string;
  name: string;
  paper: string;
  studentName: string;
  studentEmail: string;
  /** The earlier email being followed up. */
  ref?: Pick<OutreachEntry, "subject" | "sentAt"> | null;
};

const levelLower = (c: LevelCode | undefined) => (c ? levelsText([c]) : "[level]");

/** "Use template": a structured draft; unknowns are left in [brackets] for the student to fill. */
export function outreachTemplate(d: Draft): { subject: string; body: string } {
  const s = d.scholarship;
  const me = d.studentName || "[Your name]";
  const lvl = levelLower(s.levels[0]);
  const hi =
    d.to === "professor"
      ? `Dear ${d.name || "Professor [surname]"},`
      : `Dear ${d.to === "international" ? "International Office team" : "Admissions and Scholarships team"},`;
  const sign = `\n\nKind regards,\n${me}${d.studentEmail ? `\n${d.studentEmail}` : ""}`;
  const uni = d.university || "[university]";
  if (d.purpose === "follow_up")
    return {
      subject: `Follow-up: ${d.ref ? d.ref.subject : `${s.name} enquiry`}`,
      body: `${hi}\n\nI wrote to you on ${d.ref ? formatDate(d.ref.sentAt) : "[date]"} about the ${s.name} at ${uni}. I am following up in case my message was missed, as the closing date is ${formatDate(s.closes)}.\n\n[Repeat your question in one sentence]?\n\nThank you for your time.${sign}`,
    };
  if (d.purpose === "supervision")
    return {
      subject: `Prospective ${lvl} student: [research topic]`,
      body: `${hi}\n\nI am ${me}, a [current role] from Sri Lanka, planning to apply for ${lvl} study at ${uni} with the ${s.name}. I read your ${d.paper ? `work on ${d.paper}` : "[paper title]"} and was interested in [one specific point].\n\n[One or two sentences on your background, with a measurable result.]\n\nI would like to research [topic] and wanted to ask whether you are accepting new ${lvl} students for the [intake] intake. I have attached my CV and a one-page research outline.\n\nWould you be open to a short conversation?${sign}`,
    };
  return {
    subject: `${s.name} — eligibility question from a Sri Lankan applicant`,
    body: `${hi}\n\nI am ${me} from Sri Lanka. I plan to apply for [course name] at ${uni} and for the ${s.name} (closing ${formatDate(s.closes)}).\n\nI have read the published criteria but could not confirm one point: [your question]?\n\nThank you for your help.${sign}`,
  };
}

export const wordCount = (body: string) => (body.trim().match(/\S+/g) ?? []).length;

export type LiveCheck = { label: string; ok: boolean };

/** "Before you send": the live checks from the prototype. */
export function liveChecks(body: string, scholarshipName: string, to: Recipient): LiveCheck[] {
  const key = scholarshipName.split(/[\s(]/)[0];
  const wc = wordCount(body);
  const checks: (LiveCheck | null)[] = [
    { label: "Addressed to a named person or office", ok: !/sir\/madam|whom it may concern|Professor \[surname\]/i.test(body) },
    { label: `Names the scholarship (${key})`, ok: body.toLowerCase().includes(key.toLowerCase()) },
    { label: "Asks one clear question", ok: (body.match(/\?/g) ?? []).length >= 1 },
    to === "professor"
      ? {
          label: "Mentions their research specifically",
          ok: /your (recent |published )?(paper|work|research|article|study|lab|group)/i.test(body) && !/\[paper title\]/.test(body),
        }
      : null,
    { label: "No [placeholders] left to fill in", ok: !/\[[^\]]+\]/.test(body) },
    { label: "No generic flattery", ok: !/esteemed|do the needful|keen interest|deeply passionate|great honou?r|humbly request/i.test(body) },
    { label: "Under 200 words", ok: wc > 0 && wc <= 200 },
  ];
  return checks.filter((c): c is LiveCheck => c !== null);
}

/** Compose links for the student's own mail app. */
export function mailLinks(to: string, subject: string, body: string) {
  const e = encodeURIComponent;
  const addr = to.trim();
  return {
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${e(addr)}&su=${e(subject)}&body=${e(body)}`,
    outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${e(addr)}&subject=${e(subject)}&body=${e(body)}`,
    mailto: `mailto:${e(addr).replace(/%40/g, "@")}?subject=${e(subject)}&body=${e(body)}`,
  };
}

/** Text for "Copy email instead". */
export function copyText(to: string, subject: string, body: string): string {
  return `${to.trim() ? `To: ${to.trim()}\n` : ""}Subject: ${subject}\n\n${body}`;
}

export function addDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

export const recipientLabel = (e: Pick<OutreachEntry, "to" | "name">) =>
  e.to === "professor" ? e.name || "Professor" : e.to === "international" ? "International office" : "Admissions & scholarships office";

const purposeLabel: Record<Purpose, string> = {
  eligibility: "Eligibility question",
  supervision: "Supervision enquiry",
  follow_up: "Follow-up",
};

export type TrackerRow = {
  chip: "Replied" | "Followed up" | "Follow-up due" | "Awaiting reply";
  tone: "verified" | "neutral" | "warning";
  meta: string;
  /** Awaiting a reply: offer Follow up / Mark replied. */
  open: boolean;
};

/** Tracker state: Awaiting reply → Follow-up due (≥ 10 days) → Replied / Followed up. */
export function trackerRow(e: Pick<OutreachEntry, "purpose" | "sentAt" | "status">, today: string): TrackerRow {
  const since = Math.round((Date.parse(today) - Date.parse(e.sentAt)) / 86_400_000);
  const due = e.status === "awaiting" && since >= FOLLOW_UP_DAYS;
  const chip = e.status === "replied" ? "Replied" : e.status === "followed_up" ? "Followed up" : due ? "Follow-up due" : "Awaiting reply";
  const tone = e.status === "replied" ? "verified" : due ? "warning" : "neutral";
  let meta = `${purposeLabel[e.purpose]} · sent ${formatDate(e.sentAt)}`;
  if (e.status === "awaiting") {
    const from = addDays(e.sentAt, FOLLOW_UP_DAYS);
    meta += due ? ` · no reply for ${since} days` : ` · follow up from ${formatDate(from).replace(/ \d{4}$/, "")}`;
  }
  return { chip, tone, meta, open: e.status === "awaiting" };
}

/** Status precedence when the same entry was changed on two devices: a later state wins. */
const rank: Record<OutreachStatus, number> = { awaiting: 0, followed_up: 1, replied: 2 };

export function mergeOutreach(local: OutreachEntry[], remote: OutreachEntry[]): OutreachEntry[] {
  const byId = new Map<string, OutreachEntry>();
  for (const e of [...remote, ...local]) {
    const prev = byId.get(e.id);
    byId.set(e.id, prev && rank[prev.status] > rank[e.status] ? prev : e);
  }
  return [...byId.values()].sort((a, b) => b.sentAt.localeCompare(a.sentAt) || a.id.localeCompare(b.id));
}

type UniversityContact = Pick<University, "id" | "name" | "countryCode" | "websiteUrl" | "staffDirectoryUrl">;

/**
 * Universities offered in the email form: where the scholarship can be used, else every listed university
 * in its destination. Empty (multi-country awards) means the student types the name.
 */
export function emailUniversities(
  s: Pick<Scholarship, "universityId" | "destinationCode">,
  universities: UniversityContact[],
  usableIds: string[],
) {
  const ids = s.universityId ? [s.universityId, ...usableIds] : usableIds;
  const picked = ids.length ? universities.filter((u) => ids.includes(u.id)) : universities.filter((u) => u.countryCode === s.destinationCode);
  return picked.map((u) => ({ name: u.name, websiteUrl: u.websiteUrl, staffDirectoryUrl: u.staffDirectoryUrl }));
}
