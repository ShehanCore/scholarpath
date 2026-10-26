import { NextResponse } from "next/server";
import { safeNext } from "@/lib/profile";
import { authConfigured, serverClient } from "@/lib/supabase/server";

// Google sign-in, email confirmation and password-reset links land here with a one-time code.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"), "/account");
  if (authConfigured && code) {
    const supabase = await serverClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Google sign-ups arrive without a WhatsApp number or terms consent: finish registration step 1 first.
      if (data.user && !next.startsWith("/account/password")) {
        const { data: profile } = await supabase.from("profiles").select("terms_accepted_at, whatsapp").eq("id", data.user.id).maybeSingle();
        if (profile && !(profile.terms_accepted_at && profile.whatsapp))
          return NextResponse.redirect(new URL(`/register?step=1&next=${encodeURIComponent(next)}`, url.origin));
      }
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
