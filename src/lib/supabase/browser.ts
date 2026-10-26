"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False until Supabase is configured: sign-in pages then say accounts aren't available yet. */
export const authAvailable = Boolean(url && key);

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Browser client; the session lives in cookies so server actions can read it. */
export function browserClient() {
  if (!url || !key) throw new Error("Supabase isn't configured.");
  client ??= createBrowserClient<Database>(url, key);
  return client;
}
