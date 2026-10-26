// "Notify me when it reopens": which alerts are due, and the email we send. Pure, so it's testable;
// the cron route does the database and email I/O.
import type { Scholarship } from "@/lib/content/types";
import { formatDate } from "@/lib/format";
import { statusOf } from "@/lib/status";

export type PendingAlert = { id: number; scholarshipId: string; email: string; token: string };

/** An alert is due once its scholarship isn't closed any more: new dates are published (upcoming or open). */
export function dueAlerts(alerts: PendingAlert[], scholarships: Scholarship[], today: string) {
  const byId = new Map(scholarships.map((s) => [s.id, s]));
  return alerts.flatMap((a) => {
    const s = byId.get(a.scholarshipId);
    return s && statusOf(s, today) !== "Closed" ? [{ alert: a, scholarship: s }] : [];
  });
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normaliseEmail(raw: string): string | null {
  const e = raw.trim().toLowerCase();
  return e.length <= 254 && EMAIL.test(e) ? e : null;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

/** The reopen email. Never implies funding is guaranteed; always points to the official website. */
export function reopenEmail(s: Scholarship, today: string, siteUrl: string, token: string) {
  const opensLater = statusOf(s, today) === "Upcoming";
  const dates = opensLater
    ? `Applications open ${formatDate(s.opens)} and close ${formatDate(s.closes)}.`
    : `Applications are open now and close ${formatDate(s.closes)}.`;
  const detail = `${siteUrl}/scholarships/${s.id}`;
  const unsubscribe = `${siteUrl}/alerts/unsubscribe?token=${token}`;
  const subject = `${s.name}: new dates published`;
  const text = [
    `${s.name} has published new dates.`,
    dates,
    "",
    "Check your eligibility and verify the dates on the official website before you apply:",
    s.officialUrl,
    "",
    `See it on ScholarPath: ${detail}`,
    "",
    "Information only. Funding is never guaranteed.",
    `You asked us to tell you when this scholarship reopens. This is the only email for this alert. Stop alerts: ${unsubscribe}`,
  ].join("\n");
  const html = `<p><strong>${escapeHtml(s.name)}</strong> has published new dates.</p>
<p>${escapeHtml(dates)}</p>
<p>Check your eligibility and verify the dates on the official website before you apply:<br><a href="${escapeHtml(s.officialUrl)}">${escapeHtml(s.officialUrl)}</a></p>
<p><a href="${escapeHtml(detail)}">See it on ScholarPath</a></p>
<p style="color:#4B5A6B;font-size:13px">Information only. Funding is never guaranteed.<br>You asked us to tell you when this scholarship reopens. This is the only email for this alert. <a href="${escapeHtml(unsubscribe)}">Stop alerts</a></p>`;
  return { subject, text, html, unsubscribe };
}
