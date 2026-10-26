import { serviceClient, serviceConfigured } from "@/lib/db/service-client";
import { toScholarship } from "@/lib/db/queries";
import { emailConfigured, sendEmail } from "@/lib/email";
import { dueAlerts, reopenEmail } from "@/lib/reopen-alerts";
import { siteUrl } from "@/lib/site-url";
import { todayIso } from "@/lib/status";

// Daily job (vercel.json): emails everyone whose scholarship has reopened, once. Vercel Cron sends
// "Authorization: Bearer $CRON_SECRET".
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!serviceConfigured) return Response.json({ error: "Supabase isn't configured" }, { status: 503 });

  const db = serviceClient();
  const [{ data: alerts, error: e1 }, { data: rows, error: e2 }] = await Promise.all([
    db.from("reopen_alerts").select("id, scholarship_id, email, token").is("notified_at", null).is("unsubscribed_at", null),
    db.from("scholarships").select("*"),
  ]);
  if (e1 || e2 || !alerts || !rows) return Response.json({ error: (e1 ?? e2)?.message }, { status: 500 });

  const today = todayIso();
  const due = dueAlerts(
    alerts.map((a) => ({ id: a.id, scholarshipId: a.scholarship_id, email: a.email, token: a.token })),
    rows.map(toScholarship),
    today,
  );
  // Without an email provider, report what's due and leave the alerts pending.
  if (!emailConfigured) return Response.json({ due: due.length, sent: 0, note: "Email isn't configured" }, { status: 503 });

  let sent = 0;
  const failed: number[] = [];
  for (const { alert, scholarship } of due) {
    const mail = reopenEmail(scholarship, today, siteUrl(), alert.token);
    try {
      await sendEmail({ to: alert.email, subject: mail.subject, text: mail.text, html: mail.html, unsubscribeUrl: mail.unsubscribe });
      await db.from("reopen_alerts").update({ notified_at: new Date().toISOString() }).eq("id", alert.id);
      sent++;
    } catch {
      failed.push(alert.id);
    }
  }
  return Response.json({ due: due.length, sent, failed: failed.length });
}
