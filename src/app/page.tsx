import Link from "next/link";
import { ClosingCard } from "@/components/closing-card";
import { DestinationCard, destinationImage } from "@/components/destination-card";
import { BrowseA, type ChooserLists } from "@/components/home/chooser";
import { FeaturedCarousel, type FeaturedSlide } from "@/components/home/featured-carousel";
import { SearchBox } from "@/components/search-box";
import { Eyebrow, MonoNote, Panel, PanelHeader } from "@/components/ui/panel";
import { destinationStats } from "@/lib/content/derive";
import { getDestinations, getScholarships, getUniversities } from "@/lib/db/queries";
import { deadlineView, destinationHref, formatDate, levelsText, scholarshipHref, universityHref } from "@/lib/format";
import { rankLabel } from "@/lib/rank";
import { buildSearchIndex } from "@/lib/search-index";
import { byDeadline, daysLeft, statusOf } from "@/lib/status";
import { disciplines, levels } from "@/lib/taxonomy";
import { getToday } from "@/lib/today";
import { verificationChip } from "@/lib/verification";

const FEATURED_PREFERENCE = ["chevening", "daad", "erasmus"];
const FEATURED_DESTINATIONS = ["GB", "US", "AU", "CA", "DE", "NL", "JP", "EU"];
const UNIVERSITY_CHOOSER_LIMIT = 24;

const howSteps = [
  ["Find", "Browse by discipline, level, destination or university and combine filters."],
  ["Shortlist", "Save scholarships and compare up to three side by side."],
  ["Check", "Run the pre-submission review against what committees weigh."],
  ["Apply", "Submit on the official website, before the deadline."],
];
const promoBars = [
  ["Fit", 80],
  ["Evidence", 60],
  ["Clarity", 45],
  ["Feasibility", 30],
  ["Impact", 55],
] as const;

export default async function Home() {
  const [scholarships, destinations, universities, today] = await Promise.all([
    getScholarships(),
    getDestinations(),
    getUniversities(),
    getToday(),
  ]);
  const destName = (code: string) => destinations.find((d) => d.code === code)?.name ?? code;
  const stats = (code: string) => destinationStats({ code }, scholarships, universities, today);
  const searchIndex = buildSearchIndex(scholarships, destinations, universities);

  // Featured: the prototype's three when they're still open, then the next to close.
  const live = scholarships.filter((s) => statusOf(s, today) !== "Closed");
  const featured = [
    ...FEATURED_PREFERENCE.map((id) => live.find((s) => s.id === id)).filter((s) => s !== undefined),
    ...[...live].sort(byDeadline(today)).filter((s) => !FEATURED_PREFERENCE.includes(s.id)),
  ].slice(0, 3);
  const slides: FeaturedSlide[] = featured.map((s) => {
    const d = deadlineView(s, today);
    return {
      id: s.id,
      name: s.name,
      destName: destName(s.destinationCode),
      image: destinationImage(s.destinationCode),
      statusText: `${d.status} · ${d.daysText}`,
      verification: verificationChip(s).label,
      blurb: s.summary,
      tags: [levelsText(s.levels), s.disciplinesAll ? "Open to all disciplines" : (s.disciplineLabel ?? "Selected disciplines")],
      href: scholarshipHref(s.id),
      checkHref: `${scholarshipHref(s.id)}#eligibility`,
    };
  });

  const lists: ChooserLists = {
    disc: {
      label: "Discipline",
      count: String(disciplines.length),
      tileSub: "11 subject areas, aligned with THE",
      title: "Browse by discipline — THE's 11 subject areas",
      note: "Open-to-all awards appear under every discipline",
      items: disciplines.map((d) => ({ label: d.name, sub: d.includes, href: `/disciplines/${d.slug}` })),
    },
    level: {
      label: "Study level",
      count: String(levels.length),
      tileSub: "Bachelor's to PhD",
      title: "Browse by study level",
      note: "One scholarship can cover several levels",
      items: levels.map((l) => ({ label: l.name, sub: l.sub, href: `/levels/${l.slug}` })),
    },
    dest: {
      label: "Destination",
      count: String(destinations.length),
      tileSub: "18 countries and Europe-wide",
      title: "Browse by destination",
      note: "",
      items: destinations.map((d) => ({
        label: d.name,
        sub: `${stats(d.code).openScholarships} open scholarships`,
        href: destinationHref(d.code),
      })),
    },
    uni: {
      label: "University",
      count: String(universities.length),
      tileSub: "Ranked by THE 2027",
      title: "Browse by university",
      note: "THE World University Rankings 2027",
      items: universities.slice(0, UNIVERSITY_CHOOSER_LIMIT).map((u) => {
        const rank = u.rankDisplay ? `THE rank ${u.rankDisplay}` : rankLabel(u);
        return {
          label: u.name,
          sub: `${rank} · ${u.city ? `${u.city}, ` : ""}${destName(u.countryCode)}`,
          href: universityHref(u.id),
        };
      }),
      more:
        universities.length > UNIVERSITY_CHOOSER_LIMIT
          ? { label: "All universities, by destination →", href: "/destinations" }
          : undefined,
    },
  };

  const quickFilters = [
    { label: "Closing within 30 days", href: "/scholarships?dl=30" },
    { label: "PhD funding", href: "/scholarships?lv=P" },
    { label: "Research grants", href: "/scholarships?aw=Research+grant" },
  ];

  const closing = scholarships
    .filter((s) => {
      const st = statusOf(s, today);
      return st === "Closing soon" || (st === "Open" && daysLeft(s.closes, today) < 60);
    })
    .sort((a, b) => a.closes.localeCompare(b.closes));

  return (
    <>
      <section className="grid items-end gap-6 px-[clamp(4px,1.5vw,20px)] pt-[clamp(28px,5vw,64px)] pb-[clamp(28px,4vw,48px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
        <div>
          <Eyebrow className="mb-3.5 text-teal">Scholarships &amp; research funding for Sri Lankan students</Eyebrow>
          <h1 className="m-0 font-heading text-[clamp(38px,5.4vw,68px)] leading-[1.02] font-semibold tracking-[-.02em] text-balance">
            Find the right scholarship. Apply with confidence.
          </h1>
        </div>
        <p className="m-0 max-w-[460px] text-base leading-[1.6] text-pretty text-muted">
          Browse funding to study abroad by discipline, level, destination and university — then run a
          pre-submission check so the application you send is one you&apos;re confident in.
        </p>
      </section>
      <Panel labelledBy="explore-a">
        <div className="mb-[22px] flex flex-wrap items-center justify-between gap-3">
          <h2 id="explore-a" className="m-0 font-heading text-2xl font-semibold tracking-[-.01em]">
            Explore scholarships
          </h2>
          <div className="flex flex-[1_1_360px] flex-wrap justify-end gap-2.5">
            <SearchBox index={searchIndex} />
            <Link
              href="/checklist"
              className="flex h-12 items-center rounded-pill border-[1.5px] border-ink bg-surface px-5 text-xs font-bold whitespace-nowrap uppercase tracking-[.05em] text-ink no-underline hover:bg-surface-4 hover:text-ink"
            >
              Open checklist
            </Link>
          </div>
        </div>
        <BrowseA lists={lists} quickFilters={quickFilters} featured={<FeaturedCarousel slides={slides} />} />
      </Panel>

      <Panel className="mt-4" labelledBy="closing-soon">
        <PanelHeader id="closing-soon" title="Closing soon" aside={<MonoNote>Dates as of {formatDate(today)}</MonoNote>} />
        {closing.length ? (
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1.5">
            {closing.map((s) => (
              <ClosingCard key={s.id} s={s} today={today} />
            ))}
          </div>
        ) : (
          <p className="m-0 text-sm text-muted">Nothing listed closes in the next 60 days.</p>
        )}
      </Panel>

      <Panel className="mt-4" labelledBy="featured-destinations">
        <PanelHeader
          id="featured-destinations"
          title="Featured destinations"
          aside={
            <Link href="/destinations" className="flex min-h-11 items-center text-xs font-bold uppercase tracking-[.05em] no-underline">
              All {destinations.length} destinations →
            </Link>
          }
        />
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,290px),1fr))]">
          {FEATURED_DESTINATIONS.map((code, i) => {
            const d = destinations.find((x) => x.code === code);
            return d ? <DestinationCard key={code} d={d} stats={stats(code)} index={i} video /> : null;
          })}
        </div>
      </Panel>

      <Panel className="mt-4" labelledBy="how-it-works">
        <h2 id="how-it-works" className="m-0 mb-[18px] font-heading text-2xl font-semibold">
          How it works
        </h2>
        <ol className="m-0 grid list-none gap-3 p-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))]">
          {howSteps.map(([t, d], i) => (
            <li key={t} className="flex flex-col gap-2.5 rounded-card-md bg-surface-2 p-5">
              <span className="font-mono text-xs font-medium text-muted">0{i + 1}</span>
              <h3 className="m-0 font-heading text-[22px] font-semibold">{t}</h3>
              <p className="m-0 text-sm leading-[1.55] text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </Panel>

      <section
        aria-labelledby="checklist-promo"
        className="mt-4 grid items-center gap-7 rounded-card-lg bg-navy p-[clamp(22px,4vw,48px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]"
      >
        <div className="flex flex-col gap-4">
          <Eyebrow className="text-gold-on-dark">Pre-submission review checklist</Eyebrow>
          <h2
            id="checklist-promo"
            className="m-0 font-heading text-[clamp(28px,3.4vw,42px)] leading-[1.08] font-semibold text-balance text-white"
          >
            Check your application against what committees actually weigh.
          </h2>
          <p className="m-0 max-w-[520px] text-[15px] leading-[1.6] text-on-dark-muted">
            Work through eligibility, fit, evidence and your statements before you submit. Progress is saved for each
            scholarship.
          </p>
          <div>
            <Link
              href="/checklist"
              className="inline-flex h-12 items-center rounded-pill bg-gold px-6 text-xs font-bold uppercase tracking-[.05em] text-on-gold no-underline hover:bg-gold-hover hover:text-on-gold"
            >
              Start a pre-submission check
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-3.5 rounded-[22px] border border-white/14 bg-white/6 p-[22px]">
          {promoBars.map(([q, w]) => (
            <div key={q} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm font-semibold text-white">
                <span>{q}</span>
                <span className="text-[13px] font-medium text-on-dark-muted">Example</span>
              </div>
              <div className="h-2 rounded-[4px] bg-white/14" aria-hidden="true">
                <div className="h-2 rounded-[4px] bg-gold" style={{ width: `${w}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

    </>
  );
}
