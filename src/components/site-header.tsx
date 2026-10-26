"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isActive, mainNav, savedHref, type NavItem } from "@/lib/site-nav";

// Saved scholarships arrive with the shortlist in Phase 7; until then the count is always 0.
const savedCount = 0;

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close the menu after navigating.
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const savedLabel = `Saved (${savedCount})`;
  const savedActive = isActive(pathname, [savedHref]);
  const navItems: NavItem[] = [...mainNav, { label: savedLabel, href: savedHref, match: [savedHref] }];

  return (
    <header data-noprint className="sticky top-0 z-40 w-full bg-page/92 py-3 backdrop-blur-[10px]">
      <div className="container-page flex items-center gap-2.5">
        {/* Wide: account row + white nav bar + gold CTA */}
        <div className="hidden min-w-0 flex-1 flex-col gap-1.5 nav:flex">
          <div className="flex h-11 items-center justify-end gap-1">
            <Link
              href="/login"
              className="flex h-11 items-center whitespace-nowrap rounded-chip px-3 text-xs font-bold uppercase tracking-[.05em] text-ink no-underline hover:bg-ink/6 hover:text-ink"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="ml-1 flex h-11 items-center whitespace-nowrap rounded-pill border-[1.5px] border-ink px-3.5 text-xs font-bold uppercase tracking-[.05em] text-ink no-underline hover:bg-ink hover:text-white"
            >
              Register
            </Link>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-14 min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-bar bg-surface pl-4 pr-2">
              <Link href="/" aria-label="ScholarPath home" className="flex h-12 shrink-0 items-center rounded-chip px-1">
                <Image src="/assets/logo-v3.png" alt="" width={147} height={25} priority className="block h-[25px] w-auto" />
              </Link>
              <span aria-hidden="true" className="ml-2 h-7 w-px shrink-0 bg-border" />
              <nav aria-label="Main" className="min-w-0 flex-1">
                <ul className="m-0 flex list-none items-center justify-between gap-0.5 p-0">
                  {navItems.map((n) => {
                    const active = isActive(pathname, n.match);
                    return (
                      <li key={n.href}>
                        <Link
                          href={n.href}
                          aria-current={active ? "page" : undefined}
                          className={`flex h-11 items-center whitespace-nowrap rounded-input px-3 text-xs font-extrabold uppercase tracking-[.06em] no-underline hover:bg-surface-4 ${
                            active ? "text-teal hover:text-teal" : "text-ink hover:text-ink"
                          }`}
                        >
                          {n.shortLabel ?? n.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
            <Link
              href="/checklist"
              className="flex h-14 shrink-0 items-center whitespace-nowrap rounded-bar bg-gold px-4 text-[11px] font-extrabold uppercase tracking-[.05em] text-on-gold no-underline hover:bg-gold-hover hover:text-on-gold active:bg-gold-pressed"
            >
              Check my application
            </Link>
          </div>
        </div>

        {/* Narrow: logo, Saved, menu toggle */}
        <Link
          href="/"
          aria-label="ScholarPath home"
          className="flex h-12 min-w-0 shrink items-center rounded-segment bg-surface px-3.5 nav:hidden"
        >
          <Image src="/assets/logo-v3.png" alt="" width={117} height={20} priority className="block h-5 w-auto max-w-full" />
        </Link>
        <div className="flex-1 nav:hidden" />
        <Link
          href={savedHref}
          aria-current={savedActive ? "page" : undefined}
          className={`flex h-12 shrink-0 items-center whitespace-nowrap rounded-pill border-[1.5px] border-ink bg-surface px-4 text-xs font-bold uppercase tracking-[.05em] no-underline nav:hidden ${
            savedActive ? "text-teal hover:text-teal" : "text-ink hover:text-ink"
          }`}
        >
          {savedLabel}
        </Link>
        <button
          ref={toggleRef}
          type="button"
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex size-12 shrink-0 flex-col items-center justify-center gap-[5px] rounded-segment border-0 bg-surface nav:hidden"
        >
          <span aria-hidden="true" className="block h-0.5 w-[18px] bg-ink" />
          <span aria-hidden="true" className="block h-0.5 w-[18px] bg-ink" />
          <span aria-hidden="true" className="block h-0.5 w-[18px] bg-ink" />
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="container-page mt-2.5 nav:hidden">
          <nav aria-label="Main" className="flex flex-col rounded-card-md bg-surface p-2">
            <div className="mb-1 grid grid-cols-2 gap-2 border-b border-border px-1 pb-2 pt-1">
              <Link
                href="/login"
                className="flex min-h-12 items-center justify-center rounded-pill border-[1.5px] border-ink bg-surface text-[13px] font-extrabold uppercase tracking-[.05em] text-ink no-underline hover:text-ink"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="flex min-h-12 items-center justify-center rounded-pill bg-ink text-[13px] font-extrabold uppercase tracking-[.05em] text-white no-underline hover:text-white"
              >
                Register
              </Link>
            </div>
            <ul className="m-0 flex list-none flex-col p-0">
              {navItems.map((n) => {
                const active = isActive(pathname, n.match);
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-12 items-center rounded-input px-3.5 text-sm font-semibold uppercase tracking-[.05em] no-underline hover:bg-surface-4 ${
                        active ? "text-teal hover:text-teal" : "text-ink hover:text-ink"
                      }`}
                    >
                      {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/checklist"
              className="mt-1.5 flex min-h-12 items-center justify-center rounded-pill bg-gold text-[13px] font-bold uppercase tracking-[.05em] text-on-gold no-underline hover:bg-gold-hover hover:text-on-gold active:bg-gold-pressed"
            >
              Check my application
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
