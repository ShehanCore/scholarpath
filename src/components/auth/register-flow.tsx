"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { authErrorMessage } from "@/lib/auth-errors";
import { displayName, useAuthUser } from "@/lib/client/auth-store";
import type { LevelCode, Scholarship } from "@/lib/content/types";
import type { Database } from "@/lib/db/database.types";
import { filtersToQuery, blankFilters } from "@/lib/finder";
import {
  INTAKES,
  NATIONALITIES,
  PENDING_PROFILE_KEY,
  ROLES,
  WA_CODES,
  blankProfile,
  formatWhatsApp,
  matchesFor,
  parseWhatsApp,
  type Role,
  type StudyProfile,
} from "@/lib/profile";
import { authAvailable, browserClient, googleSignIn } from "@/lib/supabase/browser";
import { disciplines, levels } from "@/lib/taxonomy";
import {
  AuthTabs,
  Checkbox,
  Chip,
  FieldError,
  Heading,
  PasswordField,
  StepBars,
  TextField,
  Unavailable,
  inputClass,
  primaryButton,
  secondaryButton,
  textButton,
} from "./auth-ui";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type Props = { scholarships: Scholarship[]; destinations: { code: string; name: string }[] };

const PENDING_EMAIL_KEY = "scholarpath-pending-email";
const validEmail = (e: string) => /^\S+@\S+\.\S+$/.test(e);
const SHORT_LEVEL: Record<LevelCode, string> = { B: "Bachelor's", M: "Master's", R: "MPhil & PG", P: "PhD" };

function readPending(): { profile?: StudyProfile; email?: string } {
  try {
    return {
      profile: JSON.parse(localStorage.getItem(PENDING_PROFILE_KEY) ?? "null") ?? undefined,
      email: sessionStorage.getItem(PENDING_EMAIL_KEY) ?? undefined,
    };
  } catch {
    return {};
  }
}

function toProfile(row: ProfileRow): StudyProfile {
  return {
    levels: row.levels,
    disciplines: row.disciplines,
    destinations: row.destinations,
    nationality: row.nationality,
    intake: row.intake ?? "2027",
    deadlineReminders: row.deadline_reminders,
  };
}

/** Registration: 1 · Your account → 2 · Your study plans → 3 · Your matches. Step 2 doubles as "Edit study profile". */
export function RegisterFlow({ scholarships, destinations }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const user = useAuthUser();
  const edit = params.get("edit") === "1";
  const stepParam = Number(params.get("step") ?? 1);
  const step = (edit ? 2 : [1, 2, 3].includes(stepParam) ? stepParam : 1) as 1 | 2 | 3;
  const [row, setRow] = useState<ProfileRow | null>(null);
  const [profile, setProfile] = useState<StudyProfile>(blankProfile);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Load the signed-in profile, or what was saved locally while waiting for email confirmation.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const pending = readPending();
      if (user && authAvailable) {
        const { data } = await browserClient().from("profiles").select("*").eq("id", user.id).maybeSingle();
        if (cancelled) return;
        setRow(data);
        if (data) setProfile(toProfile(data));
      } else if (user === null) {
        if (pending.profile) setProfile(pending.profile);
        setPendingEmail(pending.email ?? null);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const goStep = (s: 1 | 2 | 3) => router.push(`/register?step=${s}`, { scroll: true });

  const saveProfile = async (p: StudyProfile) => {
    setProfile(p);
    if (user && authAvailable) {
      const { error } = await browserClient()
        .from("profiles")
        .update({
          levels: p.levels,
          disciplines: p.disciplines,
          destinations: p.destinations,
          nationality: p.nationality,
          intake: p.intake,
          deadline_reminders: p.deadlineReminders,
        })
        .eq("id", user.id);
      return error ? authErrorMessage(error) : null;
    }
    try {
      localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(p));
    } catch {}
    return null;
  };

  if (step === 1)
    return (
      <AccountStep
        user={user}
        row={row}
        onDone={(email) => {
          if (email) {
            setPendingEmail(email);
            try {
              sessionStorage.setItem(PENDING_EMAIL_KEY, email);
            } catch {}
          }
          goStep(2);
        }}
      />
    );
  if (step === 2)
    return (
      <PlansStep
        edit={edit}
        initial={profile}
        destinations={destinations}
        onSave={saveProfile}
        onBack={() => (edit ? router.push("/account") : goStep(3))}
        onDone={() => (edit ? (router.push("/account"), router.refresh()) : goStep(3))}
      />
    );

  const matches = matchesFor(profile, scholarships);
  const name = row?.name || (user ? displayName(user) : "");
  const finder = filtersToQuery({
    ...blankFilters,
    lv: profile.levels,
    disc: disciplines.filter((d) => profile.disciplines.includes(d.name)).map((d) => d.slug),
    dest: profile.destinations,
  });
  return (
    <>
      <StepBars step={3} />
      <div className="flex flex-col gap-[18px]">
        <Heading
          title={`You're all set${name ? `, ${name.split(" ")[0]}` : ""}`}
          intro={
            <>
              Based on your profile,{" "}
              <strong className="text-ink tabular-nums">
                {matches.length} {matches.length === 1 ? "scholarship" : "scholarships"}
              </strong>{" "}
              match your plans. Open each one to check your eligibility.
            </>
          }
        />
        {!user && pendingEmail && (
          <p role="status" className="m-0 rounded-segment bg-tint-bg px-4 py-3 text-sm text-tint-fg">
            We&apos;ve sent a confirmation link to {pendingEmail}. Confirm it to finish setting up your account; we&apos;ll save
            your study plans when you first log in.
          </p>
        )}
        <ProfileRows profile={profile} row={row} destinations={destinations} />
        <Checkbox
          checked={profile.deadlineReminders}
          onChange={(v) => {
            void saveProfile({ ...profile, deadlineReminders: v });
          }}
        >
          Remind me about deadlines for scholarships I save (email and WhatsApp)
        </Checkbox>
        <div className="flex flex-col gap-2.5">
          <Link href={`/scholarships${finder}`} className={`${primaryButton} flex items-center justify-center no-underline hover:text-on-gold`}>
            See my matches
          </Link>
          <Link href="/" className={`${textButton} flex items-center justify-center no-underline`}>
            Maybe later
          </Link>
        </div>
      </div>
    </>
  );
}

/** Registration step 1 is done: terms agreed and a contact number given (Google sign-ups add these after). */
export function profileComplete(row: Pick<ProfileRow, "terms_accepted_at" | "whatsapp">): boolean {
  return Boolean(row.terms_accepted_at && row.whatsapp);
}

export function ProfileRows({
  profile,
  row,
  destinations,
}: {
  profile: StudyProfile;
  row: ProfileRow | null;
  destinations: { code: string; name: string }[];
}) {
  const list = (a: string[]) => (a.length ? a.join(", ") : "Any");
  const rows: [string, string][] = [
    ["Level", list(profile.levels.map((l) => SHORT_LEVEL[l as LevelCode]))],
    ["Subjects", list(profile.disciplines)],
    ["Destinations", list(profile.destinations.map((c) => destinations.find((d) => d.code === c)?.name ?? c))],
    ["Nationality", profile.nationality],
    ["Planned start", profile.intake],
  ];
  if (row?.whatsapp) rows.push(["WhatsApp", `${formatWhatsApp(row.whatsapp)} · ${row.wa_opt_in ? "updates on" : "updates off"}`]);
  return (
    <dl className="m-0 flex flex-col gap-2.5 rounded-card-sm bg-surface-2 px-[18px] py-4">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 text-sm leading-[1.45] font-medium">
          <dt className="text-muted">{k}</dt>
          <dd className="m-0">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function AccountStep({
  user,
  row,
  onDone,
}: {
  user: ReturnType<typeof useAuthUser>;
  row: ProfileRow | null;
  /** Called with the email when it still needs confirming. */
  onDone: (pendingEmail?: string) => void;
}) {
  const params = useSearchParams();
  // Signed in with Google but not finished: collect role, WhatsApp and consent, no password.
  const completing = Boolean(user && row && !profileComplete(row));
  const [role, setRole] = useState<Role>("Student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [waCode, setWaCode] = useState("+94");
  const [wa, setWa] = useState("");
  const [waOptIn, setWaOptIn] = useState(false);
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<{ field?: string; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const waId = useId();

  // Signed in and already registered: this step is done.
  useEffect(() => {
    if (user && row && profileComplete(row)) onDone();
  }, [user, row, onDone]);
  // Pre-fill from Google once, when the signed-in profile arrives.
  const [prefilled, setPrefilled] = useState<string | null>(null);
  if (completing && user && prefilled !== user.id) {
    setPrefilled(user.id);
    setName((n) => n || displayName(user));
    setEmail(user.email ?? "");
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError({ field: "name", text: "Enter your full name." });
    if (!validEmail(email)) return setError({ field: "email", text: "Enter a valid email address." });
    // Everyone gives a contact number; WhatsApp messages need the separate opt-in below.
    const parsed = parseWhatsApp(waCode, wa);
    if ("error" in parsed) return setError({ field: "wa", text: parsed.error });
    const whatsapp = parsed.e164;
    if (!completing && password.length < 8) return setError({ field: "password", text: "Use a password with at least 8 characters." });
    if (!consent) return setError({ field: "consent", text: "Please agree to the Terms and Privacy policy to continue." });
    if (!authAvailable) return;
    setError(null);
    setPending(true);
    const supabase = browserClient();
    if (completing && user) {
      const { error: err } = await supabase
        .from("profiles")
        .update({ name: name.trim(), role, whatsapp, wa_opt_in: waOptIn, terms_accepted_at: row?.terms_accepted_at ?? new Date().toISOString() })
        .eq("id", user.id);
      setPending(false);
      if (err) return setError({ text: authErrorMessage(err) });
      return onDone();
    }
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim(), role, whatsapp, wa_opt_in: waOptIn, terms: true },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/register?step=3")}`,
      },
    });
    setPending(false);
    if (err) return setError({ text: authErrorMessage(err) });
    onDone(data.session ? undefined : email);
  };

  const google = async () => {
    if (!authAvailable) return;
    const { error: err } = await browserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/register?step=1")}` },
    });
    if (err) setError({ text: authErrorMessage(err) });
  };

  const err = (f: string) => (error?.field === f ? error.text : undefined);
  return (
    <>
      {!completing && <AuthTabs active="register" next={params.get("next") ?? undefined} />}
      <StepBars step={1} />
      <form onSubmit={submit} noValidate className="m-0 flex flex-col gap-4">
        <Heading
          title={completing ? "Finish creating your account" : "Create your free account"}
          intro="Save scholarships, get deadline reminders and keep your checklist progress on any device."
        />
        {!authAvailable && <Unavailable />}
        <div className="flex flex-col gap-1.5">
          <span id={`${waId}-role`} className="text-[13px] font-semibold">
            I&apos;m registering as
          </span>
          <div role="radiogroup" aria-labelledby={`${waId}-role`} className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <Chip key={r} role="radio" on={role === r} onClick={() => setRole(r)}>
                {r}
              </Chip>
            ))}
          </div>
        </div>
        <TextField label="Full name" autoComplete="name" placeholder="As it appears on your passport" value={name} onChange={(e) => setName(e.target.value)} error={err("name")} />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          readOnly={completing}
          onChange={(e) => setEmail(e.target.value)}
          error={err("email")}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${waId}-wa`} className="text-[13px] font-semibold">
            WhatsApp number
          </label>
          <div className="flex gap-2">
            <select
              aria-label="Country code"
              value={waCode}
              onChange={(e) => setWaCode(e.target.value)}
              className={`${inputClass.replace("w-full ", "")} w-28 shrink-0 px-2 tabular-nums`}
            >
              {WA_CODES.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
            <input
              id={`${waId}-wa`}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              required
              placeholder={waCode === "+94" ? "77 123 4567" : "Mobile number"}
              value={wa}
              onChange={(e) => setWa(e.target.value.replace(/[^\d\s]/g, ""))}
              aria-invalid={err("wa") ? true : undefined}
              aria-describedby={`${waId}-wa-hint${err("wa") ? ` ${waId}-wa-err` : ""}`}
              className={`${inputClass} flex-1 basis-0 tabular-nums`}
            />
          </div>
          <span id={`${waId}-wa-hint`} className="text-[13px] leading-[1.45] font-medium text-muted">
            Join our WhatsApp group
          </span>
          {err("wa") && <FieldError id={`${waId}-wa-err`}>{err("wa")}</FieldError>}
        </div>
        <Checkbox checked={waOptIn} onChange={setWaOptIn}>
          Send me scholarship updates and deadline reminders on WhatsApp. You can opt out any time by replying STOP.
        </Checkbox>
        {!completing && (
          <PasswordField
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="At least 8 characters."
            error={err("password")}
          />
        )}
        <Checkbox checked={consent} onChange={setConsent} invalid={Boolean(err("consent"))} describedBy={err("consent") ? `${waId}-consent-err` : undefined}>
          I agree to the <Link href="/privacy">Terms and Privacy policy</Link>. ScholarPath gives information only and doesn&apos;t guarantee
          funding.
        </Checkbox>
        {err("consent") && <FieldError id={`${waId}-consent-err`}>{err("consent")}</FieldError>}
        {error && !error.field && <FieldError>{error.text}</FieldError>}
        <button type="submit" disabled={pending || !authAvailable} className={primaryButton}>
          {pending ? "Creating your account…" : "Continue"}
        </button>
        {!completing && googleSignIn && (
          <button type="button" onClick={google} className={secondaryButton}>
            Sign up with Google
          </button>
        )}
      </form>
    </>
  );
}

function PlansStep({
  edit,
  initial,
  destinations,
  onSave,
  onBack,
  onDone,
}: {
  edit: boolean;
  initial: StudyProfile;
  destinations: { code: string; name: string }[];
  onSave: (p: StudyProfile) => Promise<string | null>;
  onBack: () => void;
  onDone: () => void;
}) {
  const [p, setP] = useState(initial);
  const [seen, setSeen] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const id = useId();
  // Pick up the stored profile when it finishes loading.
  if (seen !== initial) {
    setSeen(initial);
    setP(initial);
  }
  const toggle = <K extends "levels" | "disciplines" | "destinations">(k: K, v: StudyProfile[K][number]) =>
    setP((x) => {
      const arr = x[k] as string[];
      return { ...x, [k]: arr.includes(v) ? arr.filter((y) => y !== v) : [...arr, v] };
    });

  const groups: { key: "levels" | "disciplines" | "destinations"; legend: string; options: [string, string][] }[] = [
    { key: "levels", legend: "Study level", options: levels.map((l) => [l.code, SHORT_LEVEL[l.code]]) },
    { key: "disciplines", legend: "Subjects you're interested in", options: disciplines.map((d) => [d.name, d.name]) },
    { key: "destinations", legend: "Where you'd like to study", options: destinations.map((d) => [d.code, d.name]) },
  ];

  return (
    <>
      {!edit && <StepBars step={2} />}
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          const err = await onSave(p);
          setPending(false);
          if (err) return setError(err);
          onDone();
        }}
        className="m-0 flex flex-col gap-5"
      >
        <Heading
          title={edit ? "Edit your study profile" : "Tell us what you plan to study"}
          intro="We use this to suggest scholarships and pre-fill your filters. You can change it any time."
        />
        {groups.map((g) => (
          <fieldset key={g.key} className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-2 p-0 text-[11px] font-bold uppercase tracking-[.06em] text-muted">{g.legend}</legend>
            <div className="flex flex-wrap gap-2">
              {g.options.map(([v, label]) => (
                <Chip key={v} on={(p[g.key] as string[]).includes(v)} onClick={() => toggle(g.key, v as never)}>
                  {label}
                </Chip>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))]">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-nat`} className="text-[13px] font-semibold">
              Nationality
            </label>
            <select id={`${id}-nat`} value={p.nationality} onChange={(e) => setP({ ...p, nationality: e.target.value })} className={inputClass}>
              {NATIONALITIES.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span id={`${id}-intake`} className="text-[13px] font-semibold">
              Planned start
            </span>
            <div role="radiogroup" aria-labelledby={`${id}-intake`} className="flex gap-1.5">
              {INTAKES.map((y) => (
                <button
                  key={y}
                  type="button"
                  role="radio"
                  aria-checked={p.intake === y}
                  onClick={() => setP({ ...p, intake: y })}
                  className={`min-h-12 flex-1 rounded-input border-[1.5px] px-2 text-sm font-semibold whitespace-nowrap ${p.intake === y ? "border-ink bg-ink text-white" : "border-border-strong bg-surface text-ink"}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
        {error && <FieldError>{error}</FieldError>}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <button type="button" onClick={onBack} className={`${textButton} min-h-12 px-1`}>
            {edit ? "Cancel" : "Skip for now"}
          </button>
          <button type="submit" disabled={pending} className={primaryButton}>
            {edit ? "Save profile" : "Continue"}
          </button>
        </div>
      </form>
    </>
  );
}
