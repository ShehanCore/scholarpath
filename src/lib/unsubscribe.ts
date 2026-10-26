import "server-only";
import { serviceClient, serviceConfigured } from "@/lib/db/service-client";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type UnsubscribeKind = "alert" | "reminder";

export const unsubscribeKind = (v: unknown): UnsubscribeKind => (v === "reminder" ? "reminder" : "alert");

/**
 * Stops a reopen alert, or switches off a deadline reminder, by its token. Returns false for an unknown
 * or malformed token.
 */
export async function unsubscribeAlert(token: string, kind: UnsubscribeKind = "alert"): Promise<boolean> {
  if (!serviceConfigured || !UUID.test(token)) return false;
  const db = serviceClient();
  const { data, error } =
    kind === "reminder"
      ? await db.from("reminders").delete().eq("token", token).select("scholarship_id")
      : await db.from("reopen_alerts").update({ unsubscribed_at: new Date().toISOString() }).eq("token", token).select("id");
  return !error && (data?.length ?? 0) > 0;
}
