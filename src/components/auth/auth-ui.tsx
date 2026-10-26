"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";

/** The prototype's modal-style card (max 560px), as a page. */
export function AuthCard({ title, children, closeHref = "/" }: { title: string; children: ReactNode; closeHref?: string }) {
  return (
    <div className="flex justify-center px-0 py-[clamp(12px,6vh,72px)]">
      <section
        aria-label={title}
        className="flex w-full max-w-[560px] flex-col gap-[22px] rounded-card-lg bg-surface p-[clamp(20px,4vw,36px)] shadow-modal"
      >
        <div className="flex items-center justify-between gap-3">
          <Image src="/assets/logo-v3.png" alt="ScholarPath" width={129} height={22} className="block h-[22px] w-auto" />
          <Link
            href={closeHref}
            aria-label="Close"
            className="flex size-11 shrink-0 items-center justify-center rounded-input bg-surface-4 text-[22px] leading-none text-ink no-underline hover:bg-disabled hover:text-ink"
          >
            <span aria-hidden="true">×</span>
          </Link>
        </div>
        {children}
      </section>
    </div>
  );
}

export function AuthTabs({ active, next }: { active: "login" | "register"; next?: string }) {
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <nav aria-label="Log in or register">
      <ul className="m-0 grid list-none grid-cols-2 gap-1 rounded-segment bg-surface-4 p-1">
        {(
          [
            ["login", "Log in", `/login${q}`],
            ["register", "Register", `/register${q}`],
          ] as const
        ).map(([k, label, href]) => (
          <li key={k}>
            <Link
              href={href}
              aria-current={active === k ? "page" : undefined}
              className={`flex h-11 items-center justify-center rounded-[11px] text-xs font-extrabold uppercase tracking-[.06em] text-ink no-underline hover:text-ink ${
                active === k ? "bg-surface shadow-segment" : ""
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function StepBars({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex flex-col gap-2">
      <div aria-hidden="true" className="grid grid-cols-3 gap-1.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-1 rounded-[2px] ${i <= step ? "bg-teal" : "bg-border"}`} />
        ))}
      </div>
      <p className="m-0 text-[11px] font-bold uppercase tracking-[.06em] text-muted">
        Step {step} of 3 · {["Your account", "Your study plans", "Your matches"][step - 1]}
      </p>
    </div>
  );
}

export function Heading({ title, intro }: { title: string; intro?: ReactNode }) {
  return (
    <div>
      <h1 className="m-0 font-heading text-[28px] leading-[1.15] font-semibold">{title}</h1>
      {intro && <p className="mt-1.5 mb-0 text-[15px] leading-normal text-pretty text-muted">{intro}</p>}
    </div>
  );
}

export const inputClass =
  "h-12 w-full min-w-0 rounded-input border-[1.5px] border-border-strong bg-surface px-3.5 text-[15px] font-medium text-ink focus:border-teal aria-[invalid=true]:border-error";

export function TextField({
  label,
  error,
  hint,
  ...props
}: { label: ReactNode; error?: string; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error ? `${id}-err` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined}
        className={inputClass}
        {...props}
      />
      {hint && (
        <span id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </span>
      )}
      {error && <FieldError id={`${id}-err`}>{error}</FieldError>}
    </div>
  );
}

export function PasswordField({
  label = "Password",
  error,
  hint,
  aside,
  ...props
}: { label?: string; error?: string; hint?: ReactNode; aside?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-semibold">
          {label}
        </label>
        {aside}
      </span>
      <span className="relative flex">
        <input
          id={id}
          type={show ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={[error ? `${id}-err` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined}
          className={`${inputClass} pr-[76px]`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-pressed={show}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute top-0.5 right-1 h-11 rounded-[9px] border-0 bg-transparent px-3 text-xs font-bold text-teal"
        >
          {show ? "Hide" : "Show"}
        </button>
      </span>
      {hint && (
        <span id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </span>
      )}
      {error && <FieldError id={`${id}-err`}>{error}</FieldError>}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="m-0 text-sm font-semibold text-error">
      {children}
    </p>
  );
}

export function Checkbox({ checked, onChange, children, describedBy, invalid }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; describedBy?: string; invalid?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm leading-normal">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="mt-px size-[22px] shrink-0 accent-teal"
      />
      <span>{children}</span>
    </label>
  );
}

/** Toggle chip used for study-profile choices. */
export function Chip({ on, onClick, children, role }: { on: boolean; onClick: () => void; children: ReactNode; role?: "radio" }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role ? on : undefined}
      aria-pressed={role ? undefined : on}
      onClick={onClick}
      className={`min-h-11 rounded-pill border-[1.5px] px-3.5 text-sm font-semibold ${on ? "border-ink bg-ink text-white" : "border-border-strong bg-surface text-ink hover:bg-surface-3"}`}
    >
      {children}
    </button>
  );
}

export const primaryButton =
  "min-h-[52px] rounded-pill border-0 bg-gold px-7 text-[13px] font-extrabold uppercase tracking-[.05em] text-on-gold hover:bg-gold-hover active:bg-gold-pressed disabled:opacity-70";
export const secondaryButton =
  "min-h-[52px] rounded-pill border-[1.5px] border-border-strong bg-surface text-sm font-bold text-ink hover:bg-surface-3 disabled:opacity-70";
export const textButton = "min-h-11 border-0 bg-transparent p-0 text-sm font-bold text-teal";

export function OrDivider() {
  return (
    <div aria-hidden="true" className="flex items-center gap-3 text-[13px] font-medium text-muted">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function Unavailable() {
  return (
    <p role="note" className="m-0 rounded-segment bg-warning-bg px-4 py-3 text-sm text-warning-fg">
      Accounts aren&apos;t available yet. You can still save scholarships and use the checklist on this device.
    </p>
  );
}
