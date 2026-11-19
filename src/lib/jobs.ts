import "server-only";
import { serviceClient, serviceConfigured } from "@/lib/db/service-client";
import { toScholarship } from "@/lib/db/queries";
import { reminderEmail, reminderTarget } from "@/lib/deadline-reminders";
import { emailConfigured, sendEmail } from "@/lib/email";
import { inactivityEmail, inactivityPlan, type AccountActivity } from "@/lib/inactive-accounts";
import { dueAlerts, reopenEmail } from "@/lib/reopen-alerts";
import { siteUrl } from "@/lib/site-url";
import { todayIso } from "@/lib/status";

// The daily jobs (vercel.json runs /api/cron/daily). Each returns an HTTP status and a summary.
export type JobResult = { status: number; body: Record<string, unknown> };

/** Vercel Cron sends "Authorization: Bearer $CRON_SECRET". */
export function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

const notConfigured: JobResult = { status: 503, body: { error: "Supabase isn't configured" } };

/** "Notify me when it reopens": email everyone whose scholarship has reopened, once. */
export async function runReopenAlerts(): Promise<JobResult> {
  if (!serviceConfigured) return notConfigured;
  const db = serviceClient();
  const [{ data: alerts, error: e1 }, { data: rows, error: e2 }] = await Promise.all([
    db.from("reopen_alerts").select("id, scholarship_id, email, token").is("notified_at", null).is("unsubscribed_at", null),
    db.from("scholarships").select("*"),
  ]);
  if (e1 || e2 || !alerts || !rows) return { status: 500, body: { error: (e1 ?? e2)?.message } };

  const today = todayIso();
  const due = dueAlerts(
    alerts.map((a) => ({ id: a.id, scholarshipId: a.scholarship_id, email: a.email, token: a.token })),
    rows.map(toScholarship),
    today,
  );
  // Without an email provider, report what's due and leave the alerts pending.
  if (!emailConfigured) return { status: 503, body: { due: due.length, sent: 0, note: "Email isn't configured" } };

  let sent = 0;
  let failed = 0;
  for (const { alert, scholarship } of due) {
    const mail = reopenEmail(scholarship, today, siteUrl(), alert.token);
    try {
      await sendEmail({ to: alert.email, subject: mail.subject, text: mail.text, html: mail.html, unsubscribeUrl: mail.unsubscribe });
      await db.from("reopen_alerts").update({ notified_at: new Date().toISOString() }).eq("id", alert.id);
      sent++;
    } catch {
      failed++;
    }
  }
  return { status: 200, body: { due: due.length, sent, failed } };
}

/** "Remind me": one email 7 days before the closing date, once per closing date. */
export async function runDeadlineReminders(): Promise<JobResult> {
  if (!serviceConfigured) return notConfigured;
  const db = serviceClient();
  const target = reminderTarget(todayIso());
  const { data: closing, error: e1 } = await db.from("scholarships").select("id, name, closes, official_url").eq("closes", target);
  if (e1 || !closing) return { status: 500, body: { error: e1?.message } };
  if (!closing.length) return { status: 200, body: { due: 0, sent: 0 } };

  const { data: due, error: e2 } = await db
    .from("reminders")
    .select("user_id, scholarship_id, token")
    .eq("enabled", true)
    .in("scholarship_id", closing.map((s) => s.id))
    .or(`notified_for.is.null,notified_for.neq.${target}`);
  if (e2 || !due) return { status: 500, body: { error: e2?.message } };
  if (!emailConfigured) return { status: 503, body: { due: due.length, sent: 0, note: "Email isn't configured" } };

  let sent = 0;
  let failed = 0;
  for (const r of due) {
    const s = closing.find((x) => x.id === r.scholarship_id);
    const { data: u } = await db.auth.admin.getUserById(r.user_id);
    const to = u.user?.email;
    if (!s || !to) continue;
    const mail = reminderEmail({ id: s.id, name: s.name, closes: s.closes, officialUrl: s.official_url }, siteUrl(), r.token);
    try {
      await sendEmail({ to, subject: mail.subject, text: mail.text, html: mail.html, unsubscribeUrl: mail.unsubscribe });
      await db.from("reminders").update({ notified_for: target }).eq("user_id", r.user_id).eq("scholarship_id", r.scholarship_id);
      sent++;
    } catch {
      failed++;
    }
  }
  return { status: 200, body: { due: due.length, sent, failed } };
}

/** Accounts unused for 60 days: warn at 53, delete after 60 and 7 days after the warning. */
export async function runInactiveAccounts(): Promise<JobResult> {
  if (!serviceConfigured) return notConfigured;
  // Never delete without being able to warn first.
  if (!emailConfigured) return { status: 503, body: { warned: 0, deleted: 0, note: "Email isn't configured, so nothing is deleted" } };
  const db = serviceClient();

  const accounts: AccountActivity[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return { status: 500, body: { error: error.message } };
    const ids = data.users.map((u) => u.id);
    const { data: profiles, error: pe } = ids.length
      ? await db.from("profiles").select("id, last_seen_at, inactivity_warned_at").in("id", ids)
      : { data: [], error: null };
    if (pe) return { status: 500, body: { error: pe.message } };
    for (const u of data.users) {
      const p = profiles?.find((x) => x.id === u.id);
      accounts.push({
        id: u.id,
        email: u.email ?? null,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        lastSeenAt: p?.last_seen_at ?? null,
        warnedAt: p?.inactivity_warned_at ?? null,
      });
    }
    if (data.users.length < 1000) break;
  }

  const today = todayIso();
  const { warn, remove } = inactivityPlan(accounts, today);
  const mail = inactivityEmail(siteUrl(), today);
  let warned = 0;
  let deleted = 0;
  let failed = 0;
  for (const a of warn) {
    try {
      await sendEmail({ to: a.email!, subject: mail.subject, text: mail.text, html: mail.html });
      await db.from("profiles").update({ inactivity_warned_at: new Date().toISOString() }).eq("id", a.id);
      warned++;
    } catch {
      failed++;
    }
  }
  for (const a of remove) {
    // Deleting the sign-in account removes the profile and everything linked to it (on delete cascade).
    const { error } = await db.auth.admin.deleteUser(a.id);
    if (error) failed++;
    else deleted++;
  }
  return { status: 200, body: { accounts: accounts.length, warned, deleted, failed } };
}
