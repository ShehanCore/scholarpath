import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

/** True when the server can write: Supabase URL plus the secret (service role) key. */
export const serviceConfigured = Boolean(url && secret);

/** Server-only client that bypasses RLS. Use only after checking the caller is allowed. */
export function serviceClient() {
  if (!url || !secret) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY to write data.");
  return createClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
