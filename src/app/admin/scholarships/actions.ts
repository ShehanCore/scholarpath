"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { checkAdminAuth } from "@/lib/admin-auth";
import { parseScholarshipForm, type FieldErrors } from "@/lib/admin-scholarship";
import { serviceClient, serviceConfigured } from "@/lib/db/service-client";

export type ScholarshipFormState = { ok: boolean; message: string; errors?: FieldErrors } | null;

/** Saves one scholarship and logs the check in verification_log. The site updates within seconds. */
export async function saveScholarship(_prev: ScholarshipFormState, form: FormData): Promise<ScholarshipFormState> {
  // The proxy already guards /admin; check again because server actions are plain POST endpoints.
  const editor = checkAdminAuth((await headers()).get("authorization"));
  if (!editor) return { ok: false, message: "You're not signed in to the admin." };
  if (!serviceConfigured) return { ok: false, message: "Connect Supabase (URL and secret key) to save scholarships." };

  const id = String(form.get("id") ?? "");
  const parsed = parseScholarshipForm(form);
  if (!parsed.ok) return { ok: false, message: "Fix the highlighted fields, then save again.", errors: parsed.errors };

  const db = serviceClient();
  const { data, error } = await db.from("scholarships").update(parsed.update).eq("id", id).select("id");
  if (error) return { ok: false, message: `Couldn't save: ${error.message}` };
  if (!data?.length) return { ok: false, message: "That scholarship isn't in the database." };

  await db.from("verification_log").insert({
    scholarship_id: id,
    status: parsed.update.verification_status,
    note: `Edited in admin by ${editor}; official website checked ${parsed.update.last_verified}.`,
  });
  updateTag("scholarships");
  return { ok: true, message: "Saved. The site shows the change within a minute." };
}
