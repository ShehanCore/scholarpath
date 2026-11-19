"use client";

import Link from "next/link";
import { useActionState, useId, useState, type ReactNode } from "react";
import { timelineToLines, toLines, type FieldErrors } from "@/lib/admin-scholarship";
import type { Scholarship } from "@/lib/content/types";
import { saveScholarship, type ScholarshipFormState } from "../actions";

const inputClass =
  "w-full min-w-0 rounded-input border-[1.5px] border-border-input bg-surface px-3.5 text-[15px] text-ink aria-[invalid=true]:border-error disabled:bg-surface-4";

/** Edit form for one scholarship. Values come back from the action, so a failed save keeps what was typed. */
export function ScholarshipForm({ s, today, editable }: { s: Scholarship; today: string; editable: boolean }) {
  const [state, action, pending] = useActionState<ScholarshipFormState, FormData>(saveScholarship, null);
  const [lastVerified, setLastVerified] = useState(s.lastVerified);
  const [status, setStatus] = useState(s.verificationStatus);
  const errors: FieldErrors = state?.errors ?? {};
  const uid = useId();

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="id" value={s.id} />

      <fieldset className="m-0 flex flex-col gap-4 rounded-card-sm border border-border p-4">
        <legend className="px-1 text-sm font-bold">Checked on the official website</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Verification status" name="verification_status" error={errors.verification_status} uid={uid}>
            {(p) => (
              <select {...p} value={status} onChange={(e) => setStatus(e.target.value as Scholarship["verificationStatus"])} disabled={!editable} className={`${inputClass} min-h-12`}>
                <option value="checked">Dates checked (shows “Dates checked …”)</option>
                <option value="expected_or_to_confirm">Expected or to confirm</option>
                <option value="sample">Sample data</option>
              </select>
            )}
          </Field>
          <Field label="Last checked" name="last_verified" error={errors.last_verified} uid={uid} hint="The day you compared this record with the official website.">
            {(p) => (
              <div className="flex gap-2">
                <input {...p} type="date" value={lastVerified} onChange={(e) => setLastVerified(e.target.value)} disabled={!editable} className={`${inputClass} min-h-12 tabular-nums`} />
                <button
                  type="button"
                  disabled={!editable}
                  onClick={() => {
                    setLastVerified(today);
                    setStatus("checked");
                  }}
                  className="min-h-12 shrink-0 rounded-pill border-[1.5px] border-teal bg-surface px-4 text-xs font-bold uppercase tracking-[.05em] text-teal disabled:opacity-50"
                >
                  Checked today
                </button>
              </div>
            )}
          </Field>
        </div>
        <Field label="Still to confirm (optional)" name="human_check_note" error={errors.human_check_note} uid={uid} hint="While this has text, the page shows “Details to confirm”. Clear it once confirmed.">
          {(p) => <input {...p} defaultValue={s.humanCheckNote ?? ""} disabled={!editable} className={`${inputClass} min-h-12`} />}
        </Field>
      </fieldset>

      <Field label="Name" name="name" error={errors.name} uid={uid}>
        {(p) => <input {...p} defaultValue={s.name} disabled={!editable} className={`${inputClass} min-h-12`} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Applications open" name="opens" error={errors.opens} uid={uid}>
          {(p) => <input {...p} type="date" defaultValue={s.opens} disabled={!editable} className={`${inputClass} min-h-12 tabular-nums`} />}
        </Field>
        <Field label="Applications close" name="closes" error={errors.closes} uid={uid}>
          {(p) => <input {...p} type="date" defaultValue={s.closes} disabled={!editable} className={`${inputClass} min-h-12 tabular-nums`} />}
        </Field>
      </div>
      <Field label="Deadline note" name="deadline_note" error={errors.deadline_note} uid={uid} hint="Time zone, country-specific deadlines, or “Varies by university”.">
        {(p) => <textarea {...p} rows={3} defaultValue={s.deadlineNote ?? ""} disabled={!editable} className={`${inputClass} py-3`} />}
      </Field>
      <Field label="Official website" name="official_url" error={errors.official_url} uid={uid}>
        {(p) => <input {...p} type="url" defaultValue={s.officialUrl} disabled={!editable} className={`${inputClass} min-h-12`} />}
      </Field>
      <Field label="Summary" name="summary" error={errors.summary} uid={uid} hint="One or two sentences. No funding amounts or what it covers.">
        {(p) => <textarea {...p} rows={3} defaultValue={s.summary ?? ""} disabled={!editable} className={`${inputClass} py-3`} />}
      </Field>
      <Field label="Number of awards" name="awards" error={errors.awards} uid={uid} hint="Only if published, e.g. “About 1,500 a year”.">
        {(p) => <input {...p} defaultValue={s.awards ?? ""} disabled={!editable} className={`${inputClass} min-h-12`} />}
      </Field>
      <Field label="Eligibility" name="eligibility" error={errors.eligibility} uid={uid} hint="One requirement per line. Empty shows “Not published”.">
        {(p) => <textarea {...p} rows={6} defaultValue={toLines(s.eligibility)} disabled={!editable} className={`${inputClass} py-3`} />}
      </Field>
      <Field label="Documents" name="documents" error={errors.documents} uid={uid} hint="One document per line.">
        {(p) => <textarea {...p} rows={5} defaultValue={toLines(s.documents)} disabled={!editable} className={`${inputClass} py-3`} />}
      </Field>
      <Field label="Selection timeline" name="timeline" error={errors.timeline} uid={uid} hint="One step per line, as “Step | When”, e.g. “Interview | Feb – Apr 2027”.">
        {(p) => <textarea {...p} rows={6} defaultValue={timelineToLines(s.timeline)} disabled={!editable} className={`${inputClass} py-3 font-mono text-sm`} />}
      </Field>
      <Field label="Where it can be used" name="where_usable" error={errors.where_usable} uid={uid}>
        {(p) => <textarea {...p} rows={2} defaultValue={s.whereUsable ?? ""} disabled={!editable} className={`${inputClass} py-3`} />}
      </Field>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <button
          type="submit"
          disabled={!editable || pending}
          className="min-h-12 rounded-pill border-0 bg-gold px-7 text-xs font-bold uppercase tracking-[.05em] text-on-gold hover:bg-gold-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <Link href={`/scholarships/${s.id}`} target="_blank" className="flex min-h-11 items-center text-sm font-bold">
          View on the site ↗
        </Link>
        <p role="status" className={`m-0 basis-full text-sm font-semibold ${state?.ok === false ? "text-error" : "text-verified-fg"}`}>
          {state?.message}
        </p>
      </div>
    </form>
  );
}

type FieldProps = { id: string; name: string; "aria-invalid"?: true; "aria-describedby"?: string };

function Field({
  label,
  name,
  error,
  hint,
  uid,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  uid: string;
  children: (p: FieldProps) => ReactNode;
}) {
  const id = `${uid}-${name}`;
  const described = [hint ? `${id}-hint` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-bold">
        {label}
      </label>
      {children({ id, name, "aria-invalid": error ? true : undefined, "aria-describedby": described || undefined })}
      {hint && (
        <span id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-err`} className="text-[13px] font-semibold text-error">
          {error}
        </span>
      )}
    </div>
  );
}
