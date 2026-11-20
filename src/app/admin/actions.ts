"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, checkAdminLogin, createAdminSession, safeAdminNext } from "@/lib/admin-auth";

export type AdminLoginState = { message: string; user: string } | null;

export async function signInAdmin(_prev: AdminLoginState, form: FormData): Promise<AdminLoginState> {
  const user = String(form.get("user") ?? "");
  if (!checkAdminLogin(user, String(form.get("password") ?? ""))) {
    // Slow down guessing.
    await new Promise((r) => setTimeout(r, 800));
    return { message: "That user name or password isn't right. Use the ADMIN_USER and ADMIN_PASSWORD set in Vercel.", user };
  }
  const token = await createAdminSession();
  if (!token) return { message: "The admin isn't set up yet.", user };
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: ADMIN_SESSION_SECONDS,
  });
  redirect(safeAdminNext(String(form.get("next") ?? "")));
}

export async function signOutAdmin() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin/login");
}
