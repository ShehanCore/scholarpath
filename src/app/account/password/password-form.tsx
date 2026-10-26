"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heading, PasswordField, primaryButton } from "@/components/auth/auth-ui";
import { authErrorMessage } from "@/lib/auth-errors";
import { browserClient } from "@/lib/supabase/browser";

export function PasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <form
      noValidate
      className="m-0 flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (password.length < 8) return setError("Use a password with at least 8 characters.");
        setPending(true);
        const { error: err } = await browserClient().auth.updateUser({ password });
        setPending(false);
        if (err) return setError(authErrorMessage(err));
        router.push("/account?password=updated");
        router.refresh();
      }}
    >
      <Heading title="Choose a new password" />
      <PasswordField label="New password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 8 characters." error={error ?? undefined} />
      <button type="submit" disabled={pending} className={primaryButton}>
        Save password
      </button>
    </form>
  );
}
