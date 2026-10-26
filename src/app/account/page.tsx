import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard, Heading, Unavailable, primaryButton } from "@/components/auth/auth-ui";
import { ProfileRows, profileComplete } from "@/components/auth/register-flow";
import { initials } from "@/lib/client/auth-store";
import { getDestinations } from "@/lib/db/queries";
import { blankFilters, filtersToQuery } from "@/lib/finder";
import { authConfigured, currentUser, serverClient } from "@/lib/supabase/server";
import { disciplines } from "@/lib/taxonomy";
import { AccountLinks, YourData } from "./account-actions";

export const metadata: Metadata = { title: "My account", robots: { index: false, follow: false } };

export default function AccountPage() {
  return (
    <AuthCard title="My account">
      <Suspense fallback={<p className="m-0 text-sm text-muted">Loading your account…</p>}>
        <Account />
      </Suspense>
    </AuthCard>
  );
}

async function Account() {
  if (!authConfigured)
    return (
      <>
        <Heading title="My account" />
        <Unavailable />
        <Link href="/" className="text-sm font-bold">
          Back to home
        </Link>
      </>
    );
  const user = await currentUser();
  if (!user) return <Link href="/login?next=/account">Log in to see your account</Link>;
  const [{ data: row }, destinations] = await Promise.all([
    (await serverClient()).from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getDestinations(),
  ]);
  const name = row?.name || user.email?.split("@")[0] || "Student";
  const profile = {
    levels: row?.levels ?? [],
    disciplines: row?.disciplines ?? [],
    destinations: row?.destinations ?? [],
    nationality: row?.nationality ?? "Sri Lanka",
    intake: row?.intake ?? ("2027" as const),
    deadlineReminders: row?.deadline_reminders ?? true,
  };
  const finder = filtersToQuery({
    ...blankFilters,
    lv: profile.levels,
    disc: disciplines.filter((d) => profile.disciplines.includes(d.name)).map((d) => d.slug),
    dest: profile.destinations,
  });
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center gap-3.5">
        <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-bar bg-teal text-xl font-bold text-white">
          {initials(name)}
        </span>
        <div className="min-w-0">
          <h1 className="m-0 font-heading text-2xl leading-[1.2] font-semibold">{name}</h1>
          <p className="mt-0.5 mb-0 text-sm font-medium [overflow-wrap:anywhere] text-muted">{user.email}</p>
        </div>
      </div>
      {row && !profileComplete(row) && (
        <p role="note" className="m-0 rounded-segment bg-warning-bg px-4 py-3 text-sm text-warning-fg">
          Finish setting up your account: add your WhatsApp number and agree to the terms.{" "}
          <Link href="/register?step=1">Continue</Link>
        </p>
      )}
      <ProfileRows profile={profile} row={row} destinations={destinations.map((d) => ({ code: d.code, name: d.name }))} />
      <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))]">
        <Link href={`/scholarships${finder}`} className={`${primaryButton} flex items-center justify-center no-underline hover:text-on-gold`}>
          See my matches
        </Link>
        <Link
          href="/register?step=2&edit=1"
          className="flex min-h-[52px] items-center justify-center rounded-pill border-[1.5px] border-ink bg-surface text-[13px] font-extrabold uppercase tracking-[.05em] text-ink no-underline hover:text-ink"
        >
          Edit study profile
        </Link>
      </div>
      <AccountLinks />
      <YourData />
    </div>
  );
}
