"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authErrorMessage } from "@/lib/auth-errors";
import { safeNext } from "@/lib/profile";
import { authAvailable, browserClient, googleSignIn } from "@/lib/supabase/browser";
import { AuthTabs, FieldError, Heading, OrDivider, PasswordField, TextField, Unavailable, primaryButton, secondaryButton } from "./auth-ui";

const validEmail = (e: string) => /^\S+@\S+\.\S+$/.test(e);

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"), "/account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ field?: "email" | "password"; text: string } | null>(
    params.get("error") === "link" ? { text: "That link has expired or was already used. Log in, or ask for a new link." } : null,
  );
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    if (!validEmail(email)) return setError({ field: "email", text: "Enter a valid email address." });
    if (!password) return setError({ field: "password", text: "Enter your password." });
    if (!authAvailable) return;
    setPending(true);
    const { error: err } = await browserClient().auth.signInWithPassword({ email, password });
    setPending(false);
    if (err) return setError({ text: authErrorMessage(err) });
    setError(null);
    router.push(next);
    router.refresh();
  };

  const forgot = async () => {
    if (!validEmail(email)) return setError({ field: "email", text: "Enter your email first, then choose “Forgot password?”." });
    if (!authAvailable) return;
    setError(null);
    const { error: err } = await browserClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account/password`,
    });
    if (err) return setError({ text: authErrorMessage(err) });
    setStatus(`We’ve sent a reset link to ${email}.`);
  };

  const google = async () => {
    if (!authAvailable) return;
    const { error: err } = await browserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (err) setError({ text: authErrorMessage(err) });
  };

  return (
    <>
      <AuthTabs active="login" next={params.get("next") ?? undefined} />
      <form onSubmit={submit} noValidate className="m-0 flex flex-col gap-4">
        <Heading title="Welcome back" intro="Log in to see your saved scholarships, deadline reminders and checklist progress." />
        {!authAvailable && <Unavailable />}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error?.field === "email" ? error.text : undefined}
        />
        <PasswordField
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error?.field === "password" ? error.text : undefined}
          aside={
            <button type="button" onClick={forgot} className="min-h-11 border-0 bg-transparent p-0 text-[13px] font-semibold text-teal">
              Forgot password?
            </button>
          }
        />
        {error && !error.field && <FieldError>{error.text}</FieldError>}
        <p role="status" className="m-0 text-sm font-semibold text-verified-fg empty:hidden">
          {status}
        </p>
        <button type="submit" disabled={pending || !authAvailable} className={primaryButton}>
          {pending ? "Logging in…" : "Log in"}
        </button>
        {googleSignIn && (
          <>
            <OrDivider />
            <button type="button" onClick={google} className={secondaryButton}>
              Continue with Google
            </button>
          </>
        )}
        <p className="m-0 text-center text-sm font-medium text-muted">
          New to ScholarPath?{" "}
          <Link href={`/register${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold">
            Create a free account
          </Link>
        </p>
      </form>
    </>
  );
}
