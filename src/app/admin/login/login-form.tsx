"use client";

import { useSearchParams } from "next/navigation";
import { useActionState, useId } from "react";
import { inputClass, primaryButton } from "@/components/auth/auth-ui";
import { signInAdmin, type AdminLoginState } from "../actions";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<AdminLoginState, FormData>(signInAdmin, null);
  const next = useSearchParams().get("next") ?? "/admin";
  const id = useId();
  const err = state ? `${id}-err` : undefined;
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-user`} className="text-[13px] font-semibold">
          User name
        </label>
        <input
          id={`${id}-user`}
          name="user"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state?.user}
          aria-invalid={state ? true : undefined}
          aria-describedby={err}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-password`} className="text-[13px] font-semibold">
          Password
        </label>
        <input
          id={`${id}-password`}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state ? true : undefined}
          aria-describedby={err}
          className={inputClass}
        />
      </div>
      {state && (
        <p id={err} role="alert" className="m-0 text-sm font-semibold text-error">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
