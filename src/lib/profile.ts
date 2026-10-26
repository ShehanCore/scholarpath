// Study profile (registration step 2) and the helpers registration and the account page share.
import type { LevelCode, Scholarship } from "@/lib/content/types";

// Before the email is confirmed there's no session, so registration step 2 answers wait in localStorage
// under this key and are saved at first sign-in (components/account-sync.tsx).
export const PENDING_PROFILE_KEY = "scholarpath-pending-profile";

export type Role = "Student" | "Parent" | "Adviser / counsellor";
export const ROLES: Role[] = ["Student", "Parent", "Adviser / counsellor"];
export const INTAKES = ["2027", "2028", "Not sure"] as const;
export type Intake = (typeof INTAKES)[number];
export const NATIONALITIES = ["Sri Lanka", "India", "Bangladesh", "Nepal", "Pakistan"];

export type StudyProfile = {
  levels: LevelCode[];
  disciplines: string[];
  destinations: string[];
  nationality: string;
  intake: Intake;
  deadlineReminders: boolean;
};

export const blankProfile = (): StudyProfile => ({
  levels: [],
  disciplines: [],
  destinations: [],
  nationality: "Sri Lanka",
  intake: "2027",
  deadlineReminders: true,
});

/** Scholarships matching the plans, as in the prototype: any chosen level, any chosen destination,
 *  and open to all disciplines or any chosen one. Empty choices match everything. */
export function matchesFor(p: Pick<StudyProfile, "levels" | "disciplines" | "destinations">, scholarships: Scholarship[]) {
  return scholarships.filter(
    (s) =>
      (!p.levels.length || p.levels.some((l) => s.levels.includes(l))) &&
      (!p.destinations.length || p.destinations.includes(s.destinationCode)) &&
      (s.disciplinesAll || !p.disciplines.length || s.disciplines.some((d) => p.disciplines.includes(d))),
  );
}

export const WA_CODES: [string, string][] = [
  ["+94", "LK +94"],
  ["+91", "IN +91"],
  ["+880", "BD +880"],
  ["+977", "NP +977"],
  ["+92", "PK +92"],
  ["+960", "MV +960"],
  ["+44", "UK +44"],
  ["+61", "AU +61"],
  ["+1", "US/CA +1"],
];

/**
 * WhatsApp number to E.164 ("+94771234567"), or an error message from the prototype. Sri Lankan
 * numbers must be mobiles (7x xxx xxxx); a leading 0 is dropped.
 */
export function parseWhatsApp(code: string, raw: string): { e164: string } | { error: string } {
  const digits = raw.replace(/\D/g, "").replace(/^0/, "");
  if (code === "+94") {
    if (!/^7\d{8}$/.test(digits)) return { error: "Enter a valid Sri Lankan mobile number, e.g. 77 123 4567." };
  } else if (!/^\d{6,12}$/.test(digits)) return { error: "Enter a valid WhatsApp number." };
  return { e164: code + digits };
}

/** "+94 77 123 4567" for display. */
export function formatWhatsApp(e164: string): string {
  const m = e164.match(/^\+94(\d{2})(\d{3})(\d{4})$/);
  return m ? `+94 ${m[1]} ${m[2]} ${m[3]}` : e164;
}

/** Only relative paths are allowed as ?next= targets, so links can't send people to other sites. */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : fallback;
}
