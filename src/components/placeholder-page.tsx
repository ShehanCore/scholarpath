import Link from "next/link";

/** Stand-in for screens built in later phases, so every nav link resolves. */
export function PlaceholderPage({ title, phase }: { title: string; phase: number }) {
  return (
    <section className="section-pad mt-5 rounded-card-lg bg-surface">
      <h1 className="m-0 font-heading text-[clamp(24px,3vw,32px)] font-semibold leading-[1.15]">{title}</h1>
      <p className="mt-3 mb-0 max-w-[560px] text-muted">
        This page is coming soon (build phase {phase}).{" "}
        <Link href="/">Back to home</Link>
      </p>
    </section>
  );
}
