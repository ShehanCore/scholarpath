"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmUnsubscribe } from "./actions";

/** A button, not a GET link, so email link scanners can't unsubscribe people by accident. */
export function UnsubscribeForm({ token }: { token: string }) {
  const [done, action, pending] = useActionState(confirmUnsubscribe, null);
  if (done === true)
    return (
      <p role="status" className="m-0 text-[15px]">
        Done. You won&apos;t get this alert. <Link href="/scholarships">Find scholarships</Link>
      </p>
    );
  return (
    <form action={action} className="flex flex-col items-start gap-3">
      <input type="hidden" name="token" value={token} />
      {done === false && (
        <p role="alert" className="m-0 text-sm font-semibold text-error">
          This link isn&apos;t valid any more. The alert may already be stopped.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-pill border-0 bg-navy px-6 text-xs font-bold uppercase tracking-[.05em] text-white"
      >
        Stop this alert
      </button>
    </form>
  );
}
