import { serviceClient, serviceConfigured } from "@/lib/db/service-client";
import { currentUser, serverClient } from "@/lib/supabase/server";

// "Download my data" (PDPA): everything ScholarPath stores about the signed-in user, as JSON.
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Not logged in" }, { status: 401 });
  const db = await serverClient();
  const [profile, saved, eligibility, checklists, items, reminders, outreach] = await Promise.all([
    db.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    db.from("saved").select("scholarship_id, created_at"),
    db.from("eligibility_answers").select("scholarship_id, answers, updated_at"),
    db.from("checklists").select("*"),
    db.from("checklist_items").select("*"),
    db.from("reminders").select("*"),
    db.from("outreach").select("*"),
  ]);
  const alerts =
    serviceConfigured && user.email
      ? (await serviceClient().from("reopen_alerts").select("scholarship_id, email, created_at, notified_at, unsubscribed_at").eq("email", user.email.toLowerCase())).data
      : [];
  const body = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email, createdAt: user.created_at, signInMethods: user.identities?.map((i) => i.provider) },
    profile: profile.data,
    saved: saved.data,
    eligibilityAnswers: eligibility.data,
    checklists: checklists.data,
    checklistItems: items.data,
    reminders: reminders.data,
    emailsLogged: outreach.data,
    reopenAlerts: alerts,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="scholarpath-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
