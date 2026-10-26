"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { inputClass } from "@/components/auth/auth-ui";
import { CloseButton, Dialog } from "@/components/ui/dialog";
import type { Scholarship } from "@/lib/content/types";
import { displayName, useAuthUser } from "@/lib/client/auth-store";
import { getChecklist } from "@/lib/client/checklist-store";
import { logOutreach } from "@/lib/client/outreach-store";
import {
  FOLLOW_UP_DAYS,
  RECIPIENTS,
  addDays,
  copyText,
  liveChecks,
  mailLinks,
  outreachTemplate,
  purposeAfterRecipientChange,
  purposesFor,
  wordCount,
  type OutreachEntry,
  type Purpose,
  type Recipient,
} from "@/lib/outreach";
import { formatDate } from "@/lib/verification";

export type EmailUniversity = { name: string; websiteUrl: string | null; staffDirectoryUrl: string | null };

/** What "Follow up" pre-fills from an earlier email. */
export type EmailPreset = Partial<Pick<OutreachEntry, "to" | "university" | "name" | "email" | "purpose">> & { ref?: OutreachEntry };

type Props = {
  scholarship: Pick<Scholarship, "id" | "name" | "closes" | "levels">;
  universities: EmailUniversity[];
  preset: EmailPreset;
  today: string;
  onClose: () => void;
  /** Called after the email opened in a mail app, with the confirmation to announce. */
  onSent: (message: string) => void;
};

const google = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
const fieldLabel = "flex flex-col gap-1.5 text-[13px] font-bold text-ink";
const selectClass = `${inputClass} appearance-auto`;

/** "Write an email": compose, check, then open in the student's own mail app. ScholarPath never sends it. */
export function WriteEmailDialog(props: Props) {
  return (
    <Dialog
      open
      onClose={props.onClose}
      label="Write an email"
      className="mx-auto my-[clamp(12px,5vh,56px)] w-[calc(100%-24px)] max-w-[1040px] rounded-card-lg bg-surface p-[clamp(20px,3.5vw,36px)] text-ink shadow-modal"
    >
      <Composer {...props} />
    </Dialog>
  );
}

function Composer({ scholarship: s, universities, preset, today, onClose, onSent }: Props) {
  const uid = useId();
  const user = useAuthUser();
  const [to, setTo] = useState<Recipient>(preset.to ?? "admissions");
  const [purpose, setPurpose] = useState<Purpose>(preset.purpose ?? "eligibility");
  const [university, setUniversity] = useState(preset.university ?? universities[0]?.name ?? "");
  const [name, setName] = useState(preset.name ?? "");
  const [email, setEmail] = useState(preset.email ?? "");
  const [paper, setPaper] = useState("");
  // "Follow up" opens with the follow-up template already written (as in the prototype).
  const [initial] = useState(() =>
    preset.purpose === "follow_up"
      ? outreachTemplate({
          scholarship: s,
          to: preset.to ?? "admissions",
          purpose: "follow_up",
          university: preset.university ?? "",
          name: preset.name ?? "",
          paper: "",
          studentName: user ? displayName(user) : "",
          studentEmail: user?.email ?? "",
          ref: preset.ref,
        })
      : null,
  );
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [ai, setAi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const prof = to === "professor";
  const uni = universities.find((u) => u.name === university);
  const checks = liveChecks(body, s.name, to);
  const wc = wordCount(body);
  const hasBody = Boolean(body.trim());
  const links = mailLinks(email, subject, body);

  const applyTemplate = (message = "") => {
    const t = outreachTemplate({
      scholarship: s,
      to,
      purpose,
      university,
      name,
      paper,
      studentName: user ? displayName(user) : "",
      studentEmail: user?.email ?? "",
      ref: preset.ref,
    });
    setSubject(t.subject);
    setBody(t.body);
    setAi(false);
    setNote(message);
  };

  const draftAI = async () => {
    if (!user) return applyTemplate("Log in to draft with AI. We used the template for now.");
    setBusy(true);
    setNote("");
    const notes = Object.values(getChecklist(s.id)?.notes ?? {}).filter(Boolean).join(" | ");
    try {
      const res = await fetch("/api/outreach/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scholarshipId: s.id, to, purpose, university, name, paper, notes }),
      });
      const j = (await res.json().catch(() => ({}))) as { subject?: string; body?: string; error?: string };
      if (res.ok && j.body) {
        setSubject(j.subject ?? "");
        setBody(j.body);
        setAi(true);
      } else if (j.error === "limit") {
        applyTemplate("You’ve used today’s 20 AI drafts, so we used the template. You can draft with AI again tomorrow.");
      } else if (j.error === "unavailable" || j.error === "signin") {
        applyTemplate("AI drafting isn’t available here, so we used the template.");
      } else {
        applyTemplate("Couldn’t reach the AI drafter, so we used the template.");
      }
    } catch {
      applyTemplate("Couldn’t reach the AI drafter, so we used the template.");
    } finally {
      setBusy(false);
    }
  };

  const send = (app: "gmail" | "outlook" | "mail") => {
    logOutreach(
      { id: crypto.randomUUID(), scholarshipId: s.id, to, university, name: prof ? name : "", email: email.trim(), purpose, subject, sentAt: today, status: "awaiting" },
      preset.ref?.id,
    );
    const where = app === "gmail" ? "Gmail" : app === "outlook" ? "Outlook" : "your email app";
    onSent(`Opened in ${where}. Logged as sent — we’ll remind you to follow up on ${formatDate(addDays(today, FOLLOW_UP_DAYS))}.`);
    // Let the browser follow the link first; closing the dialog unmounts it.
    setTimeout(onClose, 0);
  };

  const copy = async () => {
    const t = copyText(email, subject, body);
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {}
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const passed = checks.filter((c) => c.ok).length;

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 mb-1.5 text-xs font-semibold uppercase tracking-[.08em] text-teal">Write an email</p>
          <h2 className="m-0 font-heading text-[clamp(24px,3vw,32px)] leading-[1.15] font-semibold">{s.name}</h2>
          <p className="m-0 mt-1.5 text-sm leading-normal text-muted">Opens in your own email account. ScholarPath never sends emails for you.</p>
        </div>
        <CloseButton onClick={onClose} label="Close" />
      </div>

      <div className="grid items-start gap-6 min-[900px]:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="sr-only">Who are you writing to?</legend>
            <div className="grid grid-cols-3 gap-1 rounded-segment bg-surface-4 p-1">
              {RECIPIENTS.map((r) => (
                <label
                  key={r.value}
                  className="flex min-h-12 cursor-pointer items-center justify-center rounded-[11px] px-2 py-1 text-center text-xs leading-[1.25] font-bold text-ink has-[:checked]:bg-surface has-[:checked]:shadow-segment has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-teal has-[:focus-visible]:outline-offset-2"
                >
                  <input
                    type="radio"
                    name={`${uid}-to`}
                    value={r.value}
                    checked={to === r.value}
                    onChange={() => {
                      setTo(r.value);
                      setPurpose((p) => purposeAfterRecipientChange(r.value, p));
                    }}
                    className="sr-only"
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className={fieldLabel}>
              University
              {universities.length > 0 ? (
                <select value={university} onChange={(e) => setUniversity(e.target.value)} className={selectClass}>
                  {universities.map((u) => (
                    <option key={u.name} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="University name" className={inputClass} />
              )}
            </label>
            <label className={fieldLabel}>
              Purpose
              <select value={purpose} onChange={(e) => setPurpose(e.target.value as Purpose)} className={selectClass}>
                {purposesFor(to).map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {prof && (
            <>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <label className={fieldLabel}>
                  Professor&apos;s name
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Professor A. Fernando" className={inputClass} />
                </label>
                <label className={fieldLabel}>
                  Their research or a paper you read
                  <input value={paper} onChange={(e) => setPaper(e.target.value)} placeholder="Paper title or research area" className={inputClass} />
                </label>
              </div>
              <a
                href={uni?.staffDirectoryUrl ?? google(`${university} staff directory ${paper}`.trim())}
                target="_blank"
                rel="noopener"
                className="flex min-h-11 items-center self-start text-sm font-bold"
              >
                Search the {university || "university"} staff directory ↗
              </a>
            </>
          )}

          <label className={fieldLabel}>
            Their email address
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@university.ac.uk" autoComplete="off" className={inputClass} />
          </label>
          {!prof && (
            <a
              href={uni?.websiteUrl ?? google(`${university} ${to === "international" ? "international office contact" : "admissions scholarships contact"}`)}
              target="_blank"
              rel="noopener"
              className="-mt-2 flex min-h-11 items-center self-start text-sm font-bold"
            >
              Find the official address on the {university || "university"} website ↗
            </a>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={draftAI}
              disabled={busy}
              className="min-h-12 rounded-pill border-0 bg-navy px-5 text-xs font-bold uppercase tracking-[.05em] text-white hover:bg-ink disabled:opacity-70"
            >
              {busy ? "Drafting…" : body ? "Redraft with AI" : "Draft with AI"}
            </button>
            <button
              type="button"
              onClick={() => applyTemplate()}
              className="min-h-12 rounded-pill border-[1.5px] border-border-input bg-surface px-[18px] text-xs font-bold uppercase tracking-[.05em] text-ink hover:bg-surface-4"
            >
              Use template
            </button>
            <span className="text-[13px] text-muted">Uses your scholarship, level and checklist notes.</span>
          </div>
          <p role="status" className={note ? "m-0 rounded-input bg-surface-2 px-3.5 py-2.5 text-[13px] leading-normal text-ink" : "sr-only"}>
            {note}
            {note.startsWith("Log in") && (
              <>
                {" "}
                <Link href="/login">Log in</Link>
              </>
            )}
          </p>
          {ai && hasBody && (
            <p className="m-0 rounded-input bg-warning-bg px-3.5 py-2.5 text-[13px] leading-normal text-warning-fg">
              AI draft. Check every fact and replace anything in [brackets] before you send.
            </p>
          )}
          <label className={fieldLabel}>
            Subject
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
          </label>
          <label className={fieldLabel}>
            Message
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
              }}
              rows={13}
              placeholder="Draft with AI, use the template, or write your own."
              className="w-full min-w-0 resize-y rounded-input border-[1.5px] border-border-strong bg-surface px-3.5 py-3 text-[15px] leading-[1.6] font-normal text-ink focus:border-teal"
            />
          </label>
        </div>

        <aside aria-label="Before you send" className="flex flex-col gap-3.5 rounded-card-md bg-surface-2 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2.5">
            <h3 className="m-0 font-heading text-lg font-bold">Before you send</h3>
            <span className="text-[13px] text-muted tabular-nums">{wc === 1 ? "1 word" : `${wc} words`}</span>
          </div>
          {hasBody ? (
            <>
              <p className="m-0 text-[13px] font-bold">
                {passed} of {checks.length} checks passed
              </p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {checks.map((c) => (
                  <li key={c.label} className="flex items-start gap-2.5 text-sm leading-[1.45]">
                    <span
                      aria-hidden="true"
                      className={`h-[22px] flex-[0_0_22px] rounded-full text-center text-xs leading-[22px] font-extrabold ${c.ok ? "bg-verified-bg text-verified-fg" : "bg-warning-bg text-warning-fg"}`}
                    >
                      {c.ok ? "✓" : "!"}
                    </span>
                    <span>
                      <span className="sr-only">{c.ok ? "Passed: " : "Check: "}</span>
                      {c.label}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="m-0 text-sm leading-normal text-muted">Checks appear here as you write.</p>
          )}
          <p className="m-0 rounded-input bg-surface px-3.5 py-3 text-[13px] leading-normal">
            Attach your CV{prof ? " and research outline" : ""} in your email app after it opens.
          </p>
          <div className="flex flex-col gap-2 border-t border-border-strong pt-3.5">
            {hasBody ? (
              <>
                <a
                  href={links.gmail}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => send("gmail")}
                  className="flex min-h-[50px] items-center justify-center rounded-pill bg-gold text-xs font-bold uppercase tracking-[.05em] text-on-gold no-underline hover:bg-gold-hover hover:text-on-gold"
                >
                  Open in Gmail ↗
                </a>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={links.outlook}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => send("outlook")}
                    className="flex min-h-12 items-center justify-center rounded-pill border-[1.5px] border-ink bg-surface text-[11px] font-bold uppercase tracking-[.05em] text-ink no-underline hover:bg-surface-4 hover:text-ink"
                  >
                    Outlook ↗
                  </a>
                  <a
                    href={links.mailto}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => send("mail")}
                    className="flex min-h-12 items-center justify-center rounded-pill border-[1.5px] border-ink bg-surface text-[11px] font-bold uppercase tracking-[.05em] text-ink no-underline hover:bg-surface-4 hover:text-ink"
                  >
                    Other app
                  </a>
                </div>
                <button
                  type="button"
                  onClick={copy}
                  aria-live="polite"
                  className="min-h-11 rounded-pill border-0 bg-transparent text-xs font-bold uppercase tracking-[.05em] text-teal underline underline-offset-[3px]"
                >
                  {copied ? "Copied — paste into any email app" : "Copy email instead"}
                </button>
              </>
            ) : (
              <p className="m-0 rounded-pill bg-disabled p-3.5 text-center text-xs font-bold uppercase tracking-[.05em] text-muted">
                Write your message to send
              </p>
            )}
            <p className="m-0 text-[13px] leading-normal text-muted">We&apos;ll log it on your shortlist and remind you to follow up after 10 days.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
