import "server-only";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/admin-auth";

/** The signed-in admin's user name, or null. Server actions check this again: they're plain POST endpoints. */
export async function currentAdmin(): Promise<string | null> {
  return readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
}
