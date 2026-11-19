import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/panel";

/** Long-form text page (About, How we verify, Privacy…): readable line length, plain headings. */
export function ProsePage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <>
      <section className="px-1 pt-[clamp(24px,4vw,48px)] pb-[clamp(16px,3vw,24px)]">
        <Eyebrow className="mb-3 text-teal">{eyebrow}</Eyebrow>
        <h1 className="m-0 font-heading text-[clamp(32px,4.4vw,52px)] leading-[1.05] font-semibold tracking-[-.02em] text-balance">{title}</h1>
        {intro && <p className="mt-4 mb-0 max-w-[680px] text-base leading-[1.6] text-pretty text-muted">{intro}</p>}
      </section>
      <article className="section-pad rounded-card-lg bg-surface">
        <div className="prose-sp max-w-[720px]">{children}</div>
      </article>
    </>
  );
}

/** A business detail from siteInfo, or a visible "To be added" marker when it hasn't been filled in. */
export function Detail({ value, children }: { value: string | number; children?: ReactNode }) {
  if (value) return <>{children ?? value}</>;
  return <span className="rounded-[6px] bg-warning-bg px-1.5 py-0.5 text-[0.92em] font-semibold text-warning-fg">To be added</span>;
}
