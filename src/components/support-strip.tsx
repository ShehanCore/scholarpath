import Link from "next/link";

const support = [
  ["Workshops", "Personal statements, academic CVs and research proposals.", "See workshops", "/adviser"],
  ["Mentor & supervisor matching", "Get matched and receive feedback on your drafts.", "Find a mentor", "/adviser"],
  ["Interview preparation", "Practise with advisers who have sat on panels.", "Book a session", "/adviser"],
  ["Funding deadlines calendar", "Track saved scholarships and set reminders.", "Open calendar", "/deadlines"],
];

/** "Support for your application" strip (detail page and checklist). */
export function SupportStrip({ className = "" }: { className?: string }) {
  return (
    <section data-noprint aria-labelledby="support-title" className={`rounded-card-lg bg-surface p-[clamp(16px,2.4vw,28px)] ${className}`}>
      <h2 id="support-title" className="m-0 mb-3.5 font-heading text-[22px] font-semibold">
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
  );
}
