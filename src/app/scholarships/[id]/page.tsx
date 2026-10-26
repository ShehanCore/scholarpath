import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EligibilityCheck } from "@/components/detail/eligibility-check";
import { NotifyButton } from "@/components/notify-button";
import { SaveButton } from "@/components/save-button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Eyebrow } from "@/components/ui/panel";
import { StatusChip } from "@/components/ui/status-chip";
import { VerificationChip } from "@/components/ui/verification-chip";
import { designScholarships } from "@/lib/content/design-data";
import { getDestinations, getScholarship, getUniversities } from "@/lib/db/queries";
import { deadlineView, destinationHref, formatDate, levelsText, universityHref } from "@/lib/format";
import { getToday } from "@/lib/today";
import { verificationChip } from "@/lib/verification";

export function generateStaticParams() {
  return designScholarships().map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/scholarships/[id]">): Promise<Metadata> {
  const s = await getScholarship((await params).id);
  if (!s) return {};
  return {
    title: s.name,
    description: s.summary ?? `${s.name} (${s.funder}): dates, eligibility and how to apply. Verify on the official website.`,
  };
}

const support = [
  ["Workshops", "Personal statements, academic CVs and research proposals.", "See workshops", "/adviser"],
  ["Mentor & supervisor matching", "Get matched and receive feedback on your drafts.", "Find a mentor", "/adviser"],
  ["Interview preparation", "Practise with advisers who have sat on panels.", "Book a session", "/adviser"],
  ["Funding deadlines calendar", "Track saved scholarships and set reminders.", "Open calendar", "/deadlines"],
];

const panel = "rounded-card-lg bg-surface p-[clamp(18px,2.4vw,28px)]";
const h2 = "m-0 font-heading text-[22px] font-semibold";

export default async function ScholarshipPage({ params }: PageProps<"/scholarships/[id]">) {
  const { id } = await params;
  const s = await getScholarship(id);
  if (!s) notFound();
  const [destinations, universities, today] = await Promise.all([getDestinations(), getUniversities(), getToday()]);
  const destName = destinations.find((d) => d.code === s.destinationCode)?.name ?? s.destinationCode;
  const uni = s.universityId ? universities.find((u) => u.id === s.universityId) : undefined;
  const d = deadlineView(s, today);
  const chip = verificationChip(s);

  const where =
    s.whereUsable ??
    (uni ? `Only at ${uni.name}.` : s.destinationCode === "EU" ? "At the partner universities in each programme consortium." : `At eligible universities in ${destName}.`);
  const usableAt = uni ? [uni] : universities.filter((u) => u.countryCode === s.destinationCode && u.rankDisplay);

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Destinations", href: "/destinations" },
          { label: destName, href: destinationHref(s.destinationCode) },
          ...(uni ? [{ label: uni.name, href: universityHref(uni.id) }] : []),
          { label: s.name },
        ]}
      />
      <section className="flex flex-wrap items-end justify-between gap-5 px-1 pt-[clamp(16px,3vw,32px)] pb-6">
        <div className="max-w-[820px]">
          <Eyebrow className="mb-3 text-teal">
            {s.funderType} scholarship · {s.funder}
          </Eyebrow>
          <h1 className="m-0 font-heading text-[clamp(38px,5vw,62px)] leading-[1.03] font-semibold tracking-[-.02em]">{s.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <VerificationChip s={s} />
          <SaveButton id={s.id} name={s.name} size="lg" />
        </div>
      </section>

      <section aria-label="Summary" className="grid gap-1 rounded-card bg-surface p-1.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))]">
        {(
          [
            ["Level", levelsText(s.levels)],
            [
              "Deadline",
              <span key="d" className="flex flex-wrap items-center gap-2">
                <StatusChip status={d.status} />
                {d.closeText}
              </span>,
            ],
            ["Destination", destName],
            ["Award type", s.awardType],
            [
              "Funding",
              <a key="f" href={s.officialUrl} target="_blank" rel="noopener" className="font-semibold">
                See on the official website ↗
              </a>,
            ],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-card-sm bg-surface-2 px-[18px] py-4">
            <p className="m-0 mb-1 text-[11px] font-semibold uppercase tracking-[.06em] text-muted">{label}</p>
            <div className="m-0 text-base font-semibold">{value}</div>
          </div>
        ))}
      </section>

      <div className="mt-4 grid items-start gap-4 min-[1040px]:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-labelledby="funding-title" className={panel}>
            <h2 id="funding-title" className={`${h2} mb-2`}>
              Funding
            </h2>
            <p className="m-0 text-[15px] leading-[1.6] text-muted">
              Amounts and what the award pays for change each cycle, so ScholarPath doesn&apos;t list them.{" "}
              <a href={s.officialUrl} target="_blank" rel="noopener" className="font-semibold">
                See funding details on the official website ↗
              </a>
            </p>
          </section>

          <section id="eligibility" aria-labelledby="eligibility-title" className={`${panel} scroll-mt-28`}>
            {s.eligibility ? (
              <EligibilityCheck id={s.id} items={s.eligibility} />
            ) : (
              <>
                <h2 id="eligibility-title" className={`${h2} mb-1.5`}>
                  Check your eligibility
                </h2>
                <p className="m-0 text-[15px] leading-[1.6] text-muted">
                  Eligibility conditions: Not published on ScholarPath yet.{" "}
                  <a href={s.officialUrl} target="_blank" rel="noopener" className="font-semibold">
                    Check them on the official website ↗
                  </a>
                </p>
              </>
            )}
          </section>

          <section aria-labelledby="docs-title" className={panel}>
            <h2 id="docs-title" className={`${h2} mb-3.5`}>
              Required documents
            </h2>
            {s.documents ? (
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {s.documents.map((doc) => (
                  <li key={doc} className="flex min-h-10 items-center rounded-pill border border-border px-4 text-sm font-medium">
                    {doc}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[15px] text-muted">Not published. Check the document list on the official website.</p>
            )}
          </section>

          <section aria-labelledby="timeline-title" className={panel}>
            <h2 id="timeline-title" className={`${h2} mb-4`}>
              Selection timeline
            </h2>
            <ol className="m-0 flex list-none flex-col p-0">
              {(s.timeline ?? [{ label: "Applications", when: `${formatDate(s.opens)} – ${d.closeText}` }]).map((step, i) => (
                <li key={step.label} className="grid grid-cols-[36px_minmax(0,1fr)] items-start gap-x-3.5 pb-[18px] sm:grid-cols-[36px_minmax(0,1fr)_auto]">
                  <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full border-[1.5px] border-navy text-[13px] font-semibold">
                    {i + 1}
                  </span>
                  <span className="pt-[7px] text-[15px] font-semibold">{step.label}</span>
                  <span className="col-start-2 font-mono text-xs font-medium text-muted sm:col-start-3 sm:pt-2 sm:whitespace-nowrap">{step.when}</span>
                </li>
              ))}
            </ol>
            {!s.timeline && <p className="m-0 text-sm text-muted">Other stages: Not published.</p>}
          </section>

          <section aria-labelledby="where-title" className={panel}>
            <h2 id="where-title" className={`${h2} mb-1.5`}>
              Where it can be used
            </h2>
            <p className="m-0 mb-3.5 text-sm text-muted">{where}</p>
            {usableAt.length > 0 && (
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {usableAt.map((u) => (
                  <li key={u.id}>
                    <Link
                      href={universityHref(u.id)}
                      className="flex min-h-11 items-center gap-2 rounded-pill border border-border bg-surface px-4 text-sm font-medium text-ink no-underline hover:border-navy hover:text-ink"
                    >
                      {u.rankDisplay && <span className="font-mono text-xs font-medium text-muted">{u.rankDisplay}</span>}
                      {u.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside aria-label="Before you apply" className="flex flex-col gap-3 min-[1040px]:sticky min-[1040px]:top-24">
          <div className="flex flex-col gap-3.5 rounded-card-lg bg-navy p-6 text-white">
            <p className="m-0 text-xs font-semibold uppercase tracking-[.06em] text-gold-on-dark">Before you apply</p>
            {d.status === "Closed" ? (
              <p className="m-0 font-heading text-[44px] leading-none font-bold">Closed</p>
            ) : d.status === "Upcoming" ? (
              <p className="m-0 font-heading text-[32px] leading-none font-bold">Opens {formatDate(s.opens)}</p>
            ) : (
              <p className="m-0 font-heading text-[44px] leading-none font-bold">
                {d.days}
                <span className="font-sans text-[15px] font-medium text-on-dark-muted"> days left</span>
              </p>
            )}
            <p className="m-0 text-sm text-on-dark-muted">
              Closes {d.closeText} · {d.status === "Upcoming" ? "opens" : "opened"} {formatDate(s.opens)}
            </p>
            {d.closed && <NotifyButton id={s.id} name={s.name} variant="onDark" />}
            <Link
              href={`/checklist?s=${s.id}`}
              className="flex min-h-[50px] items-center justify-center rounded-pill bg-gold text-xs font-bold uppercase tracking-[.05em] text-on-gold no-underline hover:bg-gold-hover hover:text-on-gold"
            >
              Start my pre-submission check
            </Link>
            <a
              href={s.officialUrl}
              target="_blank"
              rel="noopener"
              className="flex min-h-[50px] items-center justify-center rounded-pill border border-white/50 px-4 text-center text-xs font-bold uppercase tracking-[.05em] text-white no-underline hover:bg-white/10 hover:text-white"
            >
              Verify on the official website ↗
            </a>
          </div>
          <div className="flex flex-col gap-2 rounded-[22px] bg-surface p-[18px]">
            <p className="m-0 text-[13px] text-muted">
              Last verified <span className="font-semibold text-ink">{formatDate(s.lastVerified)}</span>
            </p>
            <p className="m-0 text-[13px] text-muted">
              Number of awards <span className="font-semibold text-ink">{s.awards ?? "Not published"}</span>
            </p>
            {s.deadlineNote && <p className="m-0 mt-1.5 text-[13px] leading-normal">{s.deadlineNote}</p>}
            {chip.tone === "verified" ? (
              <p className="m-0 mt-1.5 rounded-segment bg-verified-bg px-3.5 py-3 text-[13px] leading-normal text-verified-fg">
                Dates checked against published 2027/28 information. Eligibility and amounts can still change — confirm on
                the official website before you apply.
              </p>
            ) : chip.tone === "warning" ? (
              <p className="m-0 mt-1.5 rounded-segment bg-warning-bg px-3.5 py-3 text-[13px] leading-normal text-warning-fg">
                {s.verificationStatus === "expected_or_to_confirm"
                  ? "Dates are expected or still to confirm."
                  : `Dates checked ${formatDate(s.lastVerified)}, but some details still need confirming.`}
                {s.humanCheckNote ? ` ${s.humanCheckNote}` : ""} Verify on the official website — dates and conditions change
                each cycle.
              </p>
            ) : (
              <p className="m-0 mt-1.5 rounded-segment bg-warning-bg px-3.5 py-3 text-[13px] leading-normal text-warning-fg">
                Sample data. Verify on the official website — dates, amounts and conditions change each cycle.
              </p>
            )}
          </div>
        </aside>
      </div>

      <section aria-labelledby="support-title" className="mt-4 rounded-card-lg bg-surface p-[clamp(16px,2.4vw,28px)]">
        <h2 id="support-title" className={`${h2} mb-3.5`}>
          Support for your application
        </h2>
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
          {support.map(([t, desc, cta, href]) => (
            <div key={t} className="flex flex-col gap-2 rounded-card-md border border-border p-[18px]">
              <h3 className="m-0 font-heading text-[17px] font-semibold">{t}</h3>
              <p className="m-0 flex-1 text-[13px] leading-normal text-muted">{desc}</p>
              <Link href={href} className="flex min-h-11 items-center self-start text-xs font-bold uppercase tracking-[.05em] no-underline">
                {cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
