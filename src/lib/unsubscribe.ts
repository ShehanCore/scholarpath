import "server-only";
import { serviceClient, serviceConfigured } from "@/lib/db/service-client";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Stops a reopen alert by its token. Returns false for an unknown or malformed token. */
export async function unsubscribeAlert(token: string): Promise<boolean> {
  if (!serviceConfigured || !UUID.test(token)) return false;
  const { data, error } = await serviceClient()
    .from("reopen_alerts")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("token", token)
    .select("id");
  return !error && (data?.length ?? 0) > 0;
}
