import { serviceClient, serviceConfigured } from "@/lib/db/service-client";
import { reminderEmail, reminderTarget } from "@/lib/deadline-reminders";
import { emailConfigured, sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";
import { todayIso } from "@/lib/status";

// Daily job (vercel.json): emails each "Remind me" 7 days before the scholarship closes, once per
// closing date. Vercel Cron sends "Authorization: Bearer $CRON_SECRET".
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!serviceConfigured) return Response.json({ error: "Supabase isn't configured" }, { status: 503 });

  const db = serviceClient();
  const target = reminderTarget(todayIso());
  const { data: closing, error: e1 } = await db.from("scholarships").select("id, name, closes, official_url").eq("closes", target);
  if (e1 || !closing) return Response.json({ error: e1?.message }, { status: 500 });
  if (!closing.length) return Response.json({ due: 0, sent: 0 });

  const { data: due, error: e2 } = await db
    .from("reminders")
    .select("user_id, scholarship_id, token")
    .eq("enabled", true)
    .in("scholarship_id", closing.map((s) => s.id))
    .or(`notified_for.is.null,notified_for.neq.${target}`);
  if (e2 || !due) return Response.json({ error: e2?.message }, { status: 500 });
  // Without an email provider, report what's due and leave the reminders pending.
  if (!emailConfigured) return Response.json({ due: due.length, sent: 0, note: "Email isn't configured" }, { status: 503 });

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
  return Response.json({ due: due.length, sent, failed });
}
