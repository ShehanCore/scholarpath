// "Remind me" on the Deadlines calendar: one email 7 days before the closing date. Pure, so it's
// testable; the cron route does the database and email I/O.
import type { Scholarship } from "@/lib/content/types";
import { formatDate } from "@/lib/format";
import { addDays } from "@/lib/outreach";

export const REMIND_DAYS_BEFORE = 7;

/** The closing date a reminder sent today is for. */
export const reminderTarget = (today: string) => addDays(today, REMIND_DAYS_BEFORE);

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

/** Never implies funding is guaranteed; always points to the official website. */
export function reminderEmail(s: Pick<Scholarship, "id" | "name" | "closes" | "officialUrl">, siteUrl: string, token: string) {
  const closes = formatDate(s.closes);
  const detail = `${siteUrl}/scholarships/${s.id}`;
  const checklist = `${siteUrl}/checklist?s=${s.id}`;
  const unsubscribe = `${siteUrl}/alerts/unsubscribe?token=${token}&type=reminder`;
  const subject = `${s.name} closes in ${REMIND_DAYS_BEFORE} days (${closes})`;
  const text = [
    `${s.name} closes on ${closes}, in ${REMIND_DAYS_BEFORE} days.`,
    "",
    "Verify the deadline on the official website — some funders close at a set time or earlier for your country:",
    s.officialUrl,
    "",
    `Run your pre-submission check: ${checklist}`,
    `See it on ScholarPath: ${detail}`,
    "",
    "Information only. Funding is never guaranteed.",
    `You switched on a reminder for this scholarship. Stop this reminder: ${unsubscribe}`,
  ].join("\n");
  const html = `<p><strong>${escapeHtml(s.name)}</strong> closes on ${escapeHtml(closes)}, in ${REMIND_DAYS_BEFORE} days.</p>
<p>Verify the deadline on the official website — some funders close at a set time or earlier for your country:<br><a href="${escapeHtml(s.officialUrl)}">${escapeHtml(s.officialUrl)}</a></p>
<p><a href="${escapeHtml(checklist)}">Run your pre-submission check</a> · <a href="${escapeHtml(detail)}">See it on ScholarPath</a></p>
<p style="color:#4B5A6B;font-size:13px">Information only. Funding is never guaranteed.<br>You switched on a reminder for this scholarship. <a href="${escapeHtml(unsubscribe)}">Stop this reminder</a></p>`;
  return { subject, text, html, unsubscribe };
}
