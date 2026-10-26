// Plain-language messages for Supabase Auth errors. Never reveals whether an account exists.
export function authErrorMessage(err: { message?: string; code?: string } | null | undefined): string {
  const code = err?.code ?? "";
  const msg = (err?.message ?? "").toLowerCase();
  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) return "Email or password is incorrect.";
  if (code === "email_not_confirmed" || msg.includes("email not confirmed"))
    return "Confirm your email first. We sent you a link when you registered.";
  if (code === "user_already_exists" || msg.includes("already registered"))
    return "An account with this email already exists. Log in instead.";
  if (code === "weak_password" || msg.includes("password should")) return "Use a password with at least 8 characters.";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || msg.includes("rate limit"))
    return "Too many attempts. Wait a few minutes and try again.";
  if (msg.includes("provider is not enabled")) return "Google sign-in isn't available yet. Use your email instead.";
  return "Something went wrong. Please try again.";
}
