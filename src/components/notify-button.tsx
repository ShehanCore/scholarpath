"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { requestReopenAlert, type ReopenAlertState } from "@/app/actions/reopen-alert";
import { CloseButton, Dialog } from "./ui/dialog";

/** "Notify me when it reopens" on closed scholarships: one email when new dates are published. */
export function NotifyButton({ id, name, variant = "card" }: { id: string; name: string; variant?: "card" | "onDark" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "onDark"
            ? "min-h-[50px] rounded-pill border-0 bg-surface text-xs font-bold uppercase tracking-[.05em] text-navy hover:bg-surface-4"
            : "min-h-11 shrink-0 rounded-pill border-[1.5px] border-ink bg-surface px-3.5 text-[11px] font-bold uppercase tracking-[.05em] text-ink hover:bg-surface-4"
        }
      >
        Notify me when it reopens
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        label={`Notify me when ${name} reopens`}
        className="m-auto w-[calc(100%-24px)] max-w-[560px] rounded-card-lg bg-surface p-[clamp(20px,4vw,36px)] text-ink shadow-modal"
      >
        <NotifyForm id={id} name={name} onClose={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function NotifyForm({ id, name, onClose }: { id: string; name: string; onClose: () => void }) {
  const [state, action, pending] = useActionState<ReopenAlertState, FormData>(requestReopenAlert, null);
  const uid = useId();
  const emailErr = state?.field === "email";
  const consentErr = state?.field === "consent";
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="m-0 font-heading text-2xl leading-[1.2] font-semibold">Notify me when it reopens</h2>
        <CloseButton onClick={onClose} label="Close" />
      </div>
      {state?.ok ? (
        <>
          <p role="status" className="m-0 rounded-input bg-verified-bg px-4 py-3 text-[15px] text-verified-fg">
            {state.message}
          </p>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="min-h-12 self-start rounded-pill border-0 bg-navy px-6 text-xs font-bold uppercase tracking-[.05em] text-white"
          >
            Close
          </button>
        </>
      ) : (
        <form action={action} noValidate className="flex flex-col gap-4">
          <p className="m-0 text-[15px] leading-[1.6] text-muted">
            {name} is closed. We&apos;ll send you one email when new dates are published. Always verify dates on the
            official website.
          </p>
          <input type="hidden" name="scholarshipId" value={id} />
          <div aria-hidden="true" className="absolute -left-[9999px]">
            <label>
              Website <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${uid}-email`} className="text-sm font-semibold">
              Email
            </label>
            <input
              id={`${uid}-email`}
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state?.values?.email}
              required
              aria-invalid={emailErr || undefined}
              aria-describedby={emailErr ? `${uid}-err` : undefined}
              className={`min-h-12 rounded-segment border-[1.5px] bg-surface px-3.5 text-[15px] ${emailErr ? "border-error" : "border-border-input"}`}
            />
          </div>
          <label className="flex items-start gap-3 text-sm leading-normal">
            <input
              type="checkbox"
              name="consent"
              value="yes"
              defaultChecked={state?.values?.consent}
              required
              aria-invalid={consentErr || undefined}
              aria-describedby={consentErr ? `${uid}-err` : undefined}
              className="mt-0.5 size-6 shrink-0 accent-teal"
            />
            <span>
              Email me once when {name} publishes new dates. ScholarPath uses this address only for this alert, and every
              email has a link to stop. See our <Link href="/privacy">privacy notice</Link>.
            </span>
          </label>
          {state && !state.ok && (
            <p id={`${uid}-err`} role="alert" className="m-0 text-sm font-semibold text-error">
              {state.message}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="min-h-12 self-start rounded-pill border-0 bg-gold px-6 text-xs font-bold uppercase tracking-[.05em] text-on-gold hover:bg-gold-hover disabled:opacity-70"
          >
            {pending ? "Saving…" : "Notify me"}
          </button>
        </form>
      )}
    </div>
  );
}
