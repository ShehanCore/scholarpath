import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// The publishable key (or a legacy anon key) is safe in the browser; RLS limits it to public content.
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);

/** Read-only client for public content. No session: user data goes through the auth client (Phase 7). */
export function contentClient() {
  if (!url || !key) throw new Error("Supabase isn't configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
