// Inactive accounts: warn at 53 days without use, delete after 60 days and at least 7 days after the
// warning (privacy notice). Pure, so it's testable; the daily job does the I/O.
import { addDays } from "@/lib/outreach";
import { formatDate } from "@/lib/verification";

export const INACTIVE_DAYS = 60;
export const WARNING_DAYS_BEFORE = 7;

export type AccountActivity = {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  lastSeenAt: string | null;
  warnedAt: string | null;
};

const day = (iso: string) => iso.slice(0, 10);
const daysBetween = (from: string, to: string) => Math.round((Date.parse(day(to)) - Date.parse(day(from))) / 86_400_000);

/** The latest of sign-up, last sign-in and last use. */
export function lastActive(a: AccountActivity): string {
  return [a.createdAt, a.lastSignInAt, a.lastSeenAt].filter((x): x is string => Boolean(x)).sort().at(-1)!;
}

/** Who to warn today and who to delete today. A warning older than the last activity doesn't count. */
export function inactivityPlan(accounts: AccountActivity[], today: string) {
  const warn: AccountActivity[] = [];
  const remove: AccountActivity[] = [];
  for (const a of accounts) {
    const active = lastActive(a);
    const idle = daysBetween(active, today);
    const warnedSinceActive = a.warnedAt !== null && a.warnedAt > active;
    if (idle >= INACTIVE_DAYS && warnedSinceActive && daysBetween(a.warnedAt!, today) >= WARNING_DAYS_BEFORE) remove.push(a);
    else if (idle >= INACTIVE_DAYS - WARNING_DAYS_BEFORE && !warnedSinceActive && a.email) warn.push(a);
  }
  return { warn, remove };
}

/** The warning email. */
export function inactivityEmail(siteUrl: string, today: string) {
  const deadline = formatDate(addDays(today, WARNING_DAYS_BEFORE));
  const login = `${siteUrl}/login`;
  const subject = "Your ScholarPath account will be deleted in 7 days";
  const text = [
    `You haven't used your ScholarPath account for ${INACTIVE_DAYS - WARNING_DAYS_BEFORE} days.`,
    `To protect your data, we delete accounts after ${INACTIVE_DAYS} days without use. Sign in before ${deadline} to keep yours:`,
    login,
    "",
    "If you'd like it deleted, you don't need to do anything. Your saved scholarships, checklists and email log will be removed with it.",
  ].join("\n");
  const html = `<p>You haven't used your ScholarPath account for ${INACTIVE_DAYS - WARNING_DAYS_BEFORE} days.</p>
<p>To protect your data, we delete accounts after ${INACTIVE_DAYS} days without use. <a href="${login}">Sign in</a> before ${deadline} to keep yours.</p>
<p style="color:#4B5A6B;font-size:13px">If you'd like it deleted, you don't need to do anything. Your saved scholarships, checklists and email log will be removed with it.</p>`;
  return { subject, text, html };
}
