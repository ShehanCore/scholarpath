"use server";

import { serviceClient, serviceConfigured } from "@/lib/db/service-client";
import { normaliseEmail } from "@/lib/reopen-alerts";
import { statusOf, todayIso } from "@/lib/status";

export type ReopenAlertState = {
  ok: boolean;
  message: string;
  field?: "email" | "consent";
  /** What the visitor entered, so the form can keep it after an error (React resets forms on submit). */
  values?: { email: string; consent: boolean };
} | null;

const PER_EMAIL_PER_HOUR = 10;

/** Saves a "Notify me when it reopens" request. Needs a valid email and the consent box ticked. */
export async function requestReopenAlert(_prev: ReopenAlertState, form: FormData): Promise<ReopenAlertState> {
  // Bots fill every field; people never see this one.
  if (String(form.get("website") ?? "")) return { ok: true, message: "Thanks." };
  const values = { email: String(form.get("email") ?? ""), consent: form.get("consent") === "yes" };
  const fail = (message: string, field?: "email" | "consent"): ReopenAlertState => ({ ok: false, message, field, values });

  const email = normaliseEmail(values.email);
  if (!email) return fail("Enter an email address, like name@example.com.", "email");
  if (!values.consent) return fail("Tick the box to agree to this one email.", "consent");
  if (!serviceConfigured) return fail("Reopen alerts aren't available yet. Please check back later.");

  const scholarshipId = String(form.get("scholarshipId") ?? "");
  const db = serviceClient();
  const { data: s } = await db.from("scholarships").select("id, opens, closes").eq("id", scholarshipId).maybeSingle();
  if (!s) return fail("That scholarship isn't listed any more.");
  if (statusOf(s, todayIso()) !== "Closed") return fail("This scholarship isn't closed now. Check the dates on its official website.");

  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db.from("reopen_alerts").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since);
  if ((count ?? 0) >= PER_EMAIL_PER_HOUR) return fail("Too many requests for this email. Try again in an hour.");

  const { error } = await db
    .from("reopen_alerts")
    .upsert({ scholarship_id: s.id, email }, { onConflict: "scholarship_id,email", ignoreDuplicates: true });
  if (error) return fail("Something went wrong. Please try again.");
  return { ok: true, message: "Done. We'll email you once when new dates are published." };
}
