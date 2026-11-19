// Scholarship editor (/admin/scholarships): turns the edit form into a database update, enforcing the
// content rules in CLAUDE.md. Pure, so it's testable; the server action does the I/O.
import type { Database } from "@/lib/db/database.types";

type Row = Database["public"]["Tables"]["scholarships"]["Row"];
export type ScholarshipUpdate = Pick<
  Row,
  | "name"
  | "opens"
  | "closes"
  | "deadline_note"
  | "official_url"
  | "verification_status"
  | "last_verified"
  | "human_check_note"
  | "summary"
  | "awards"
  | "eligibility"
  | "documents"
  | "timeline"
  | "where_usable"
>;

/** Funding amounts and "what it covers" never appear on the site (CLAUDE.md); link to the official website instead. */
export const FUNDING_TEXT = /[€£$¥]|\bCHF\b|\bLKR\b|\bRs\.?\s?\d|stipend|allowance|fee (waiver|remission|offset)|tuition|a month|a year:|fully funded|partially funded/i;

const STATUSES: Row["verification_status"][] = ["checked", "expected_or_to_confirm", "sample"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type FieldErrors = Partial<Record<keyof ScholarshipUpdate, string>>;

const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const orNull = (s: string) => (s ? s : null);
/** One item per line; blank lines dropped. Empty → null, which the site shows as "Not published". */
const lines = (s: string) => {
  const items = s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return items.length ? items : null;
};

function validDate(s: string): boolean {
  if (!ISO_DATE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Form → update, or the errors to show next to each field. */
export function parseScholarshipForm(form: FormData): { ok: true; update: ScholarshipUpdate } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const name = str(form, "name");
  const opens = str(form, "opens");
  const closes = str(form, "closes");
  const officialUrl = str(form, "official_url");
  const status = str(form, "verification_status") as Row["verification_status"];
  const lastVerified = str(form, "last_verified");

  if (!name) errors.name = "Enter the scholarship's name.";
  if (!validDate(opens)) errors.opens = "Enter the opening date.";
  if (!validDate(closes)) errors.closes = "Enter the closing date.";
  else if (validDate(opens) && opens > closes) errors.closes = "The closing date must be on or after the opening date.";
  if (!/^https?:\/\/[^\s]+\.[^\s]+$/i.test(officialUrl)) errors.official_url = "Enter the full official link, starting with https://";
  if (!STATUSES.includes(status)) errors.verification_status = "Choose a verification status.";
  if (!validDate(lastVerified)) errors.last_verified = "Enter the date you last checked the official website.";

  const timelineLines = lines(str(form, "timeline"));
  const timeline = timelineLines?.map((l) => {
    const [label, ...rest] = l.split("|");
    return { label: label.trim(), when: rest.join("|").trim() };
  }) ?? null;
  if (timeline?.some((t) => !t.label || !t.when)) errors.timeline = "Write each step as “Step | When”, one per line.";

  const update: ScholarshipUpdate = {
    name,
    opens,
    closes,
    deadline_note: orNull(str(form, "deadline_note")),
    official_url: officialUrl,
    verification_status: status,
    last_verified: lastVerified,
    human_check_note: orNull(str(form, "human_check_note")),
    summary: orNull(str(form, "summary")),
    awards: orNull(str(form, "awards")),
    eligibility: lines(str(form, "eligibility")),
    documents: lines(str(form, "documents")),
    timeline,
    where_usable: orNull(str(form, "where_usable")),
  };

  const prose: [keyof ScholarshipUpdate, string | null][] = [
    ["summary", update.summary],
    ["deadline_note", update.deadline_note],
    ["awards", update.awards],
    ["where_usable", update.where_usable],
    ["eligibility", update.eligibility?.join("\n") ?? null],
  ];
  for (const [key, text] of prose)
    if (text && FUNDING_TEXT.test(text))
      errors[key] ??= "Remove funding amounts and what it covers. The page links to the official website for funding details.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, update };
}

/** Lines for a textarea from a stored list (inverse of parsing). */
export const toLines = (items: string[] | null) => (items ?? []).join("\n");
export const timelineToLines = (t: Row["timeline"]) => (t ?? []).map((s) => `${s.label} | ${s.when}`).join("\n");
