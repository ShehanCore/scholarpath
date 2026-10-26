import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/db/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const authConfigured = Boolean(url && key);

/** Per-request client acting as the signed-in user (RLS applies). Reads and refreshes the session cookies. */
export async function serverClient() {
  if (!url || !key) throw new Error("Supabase isn't configured.");
  const store = await cookies();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only; the proxy refreshes them instead.
        }
      },
    },
  });
}

/** The signed-in user, verified with Supabase (not just decoded from the cookie), or null. */
export async function currentUser() {
  if (!authConfigured) return null;
  const { data } = await (await serverClient()).auth.getUser();
  return data.user;
}
