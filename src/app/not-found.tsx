import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section-pad mt-5 rounded-card-lg bg-surface">
      <p className="m-0 mb-3 text-xs font-semibold uppercase tracking-[.08em] text-teal">Page not found</p>
      <h1 className="m-0 font-heading text-[clamp(28px,3.4vw,40px)] leading-[1.1] font-semibold">We couldn&apos;t find that page.</h1>
      <p className="mt-3 mb-5 max-w-[560px] text-[15px] leading-[1.6] text-muted">
        The link may be old, or the scholarship may have moved. Search all scholarships instead.
      </p>
      <div className="flex flex-wrap gap-2.5">
        <Link
          href="/scholarships"
          className="flex min-h-12 items-center rounded-pill bg-gold px-6 text-xs font-bold uppercase tracking-[.05em] text-on-gold no-underline hover:bg-gold-hover hover:text-on-gold"
        >
          Find scholarships
        </Link>
        <Link
          href="/"
          className="flex min-h-12 items-center rounded-pill border-[1.5px] border-ink px-6 text-xs font-bold uppercase tracking-[.05em] text-ink no-underline hover:bg-surface-4 hover:text-ink"
        >
          Home
        </Link>
      </div>
    </section>
  );
}
