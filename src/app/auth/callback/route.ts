import { NextResponse } from "next/server";
import { safeNext } from "@/lib/profile";
import { authConfigured, serverClient } from "@/lib/supabase/server";

// Google sign-in, email confirmation and password-reset links land here with a one-time code.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"), "/account");
  if (authConfigured && code) {
    const { error } = await (await serverClient()).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
