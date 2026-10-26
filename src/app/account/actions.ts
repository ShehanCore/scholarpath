"use server";

import { redirect } from "next/navigation";
import { serviceClient, serviceConfigured } from "@/lib/db/service-client";
import { currentUser, serverClient } from "@/lib/supabase/server";

/**
 * Deletes the account and everything linked to it (PDPA): the auth user cascades to profile, saved,
 * checklists, eligibility answers, reminders and outreach; reopen alerts are matched by email.
 */
export async function deleteAccount(_prev: string | null, form: FormData): Promise<string | null> {
  if (form.get("confirm") !== "DELETE") return "Type DELETE to confirm.";
  const user = await currentUser();
  if (!user) return "You're not logged in.";
  if (!serviceConfigured) return "Account deletion isn't available yet. Email us and we'll delete your data.";
  const admin = serviceClient();
  if (user.email) await admin.from("reopen_alerts").delete().eq("email", user.email.toLowerCase());
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return "Something went wrong. Please try again, or email us and we'll delete your data.";
  await (await serverClient()).auth.signOut();
  redirect("/?account=deleted");
}
