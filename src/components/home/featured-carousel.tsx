"use client";

import Image from "next/image";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

export type FeaturedSlide = {
  id: string;
  name: string;
  destName: string;
  image: string;
  statusText: string;
  verification: string;
  blurb: string | null;
  tags: string[];
  href: string;
  checkHref: string;
};

/**
 * Layout A's featured scholarship. Rotates every 7 s like the prototype, with a pause button (WCAG 2.2.2);
 * never rotates for reduced motion, and pauses while hovered or focused.
 */
const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeReduced(onChange: () => void) {
  const mq = matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function FeaturedCarousel({ slides }: { slides: FeaturedSlide[] }) {
  const [i, setI] = useState(0);
  const reduced = useSyncExternalStore(subscribeReduced, () => matchMedia(REDUCED).matches, () => true);
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? reduced;
  const [hold, setHold] = useState(false);

  useEffect(() => {
    if (paused || hold || slides.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [paused, hold, slides.length]);

  const s = slides[i];
  if (!s) return null;
  return (
    <article
      aria-roledescription="carousel"
      aria-label="Featured scholarships"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHold(false)}
      className="relative flex min-h-[clamp(360px,36vw,440px)] overflow-hidden rounded-card bg-navy"
    >
      <Image src={s.image} alt="" fill sizes="(min-width: 1380px) 1000px, 100vw" className="object-cover" />
      <div
        aria-live={paused ? "polite" : "off"}
        className="relative z-[1] flex w-full flex-col justify-between gap-5 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-navy)_92%,transparent)_0%,color-mix(in_srgb,var(--color-navy)_78%,transparent)_55%,color-mix(in_srgb,var(--color-navy)_30%,transparent)_100%)] p-[clamp(20px,3vw,32px)]"
      >
        <p className="m-0 text-sm font-semibold text-white">Featured · {s.destName}</p>
        <div className="flex max-w-[520px] flex-col gap-3.5">
          <div className="flex flex-wrap gap-2">
            {[s.statusText, s.verification].map((t) => (
              <span key={t} className="flex h-[30px] items-center rounded-chip bg-white/16 px-3 text-xs font-semibold text-white">
                {t}
              </span>
            ))}
          </div>
          <h3 className="m-0 font-heading text-[clamp(30px,3.6vw,44px)] leading-[1.05] font-semibold tracking-[-.015em] text-white">
            {s.name}
          </h3>
          {s.blurb && <p className="m-0 max-w-[440px] text-[15px] leading-[1.55] text-on-dark-muted">{s.blurb}</p>}
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {s.tags.map((t) => (
              <li key={t} className="flex h-8 items-center rounded-pill border border-white/70 px-3.5 text-[13px] font-medium text-white">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2.5">
            <Link
              href={s.href}
              className="flex h-[46px] items-center rounded-pill bg-gold px-[22px] text-xs font-bold uppercase tracking-[.05em] text-on-gold no-underline hover:bg-gold-hover hover:text-on-gold"
            >
              View scholarship
            </Link>
            <Link
              href={s.checkHref}
              className="flex h-[46px] items-center rounded-pill border border-white/50 bg-white/14 px-[22px] text-xs font-bold uppercase tracking-[.05em] text-white no-underline hover:bg-white/24 hover:text-white"
            >
              Check your eligibility
            </Link>
          </div>
          {slides.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setUserPaused(!paused)}
                aria-label={paused ? "Play featured scholarships" : "Pause featured scholarships"}
                className="flex size-11 items-center justify-center rounded-pill border-0 bg-transparent text-white hover:bg-white/14"
              >
                {paused ? <Play aria-hidden="true" size={16} /> : <Pause aria-hidden="true" size={16} />}
              </button>
              {slides.map((x, n) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setI(n)}
                  aria-label={`Show ${x.name}`}
                  aria-current={n === i ? "true" : undefined}
                  className="flex size-11 items-center justify-center border-0 bg-transparent"
                >
                  <span className={`block h-[3px] w-7 rounded-[2px] ${n === i ? "bg-white" : "bg-white/40"}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
