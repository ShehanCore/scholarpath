import Image from "next/image";
import Link from "next/link";
import { footerNav } from "@/lib/site-nav";

export function SiteFooter() {
  return (
    <footer data-noprint className="container-page w-full pb-7">
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 rounded-card-md bg-surface px-[clamp(16px,2.4vw,28px)] py-[clamp(12px,1.6vw,18px)]">
        <div className="flex min-w-0 flex-col items-start gap-1">
          <Image src="/assets/logo-v3.png" alt="ScholarPath" width={129} height={22} className="block h-[22px] w-auto max-w-full" />
          <p className="m-0 text-xs text-muted">
            Information only. Funding is never guaranteed. Always check eligibility with the funder.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="m-0 flex list-none flex-wrap gap-1 p-0">
            {footerNav.map((f) => (
              <li key={f.href}>
                <Link
                  href={f.href}
                  className="flex min-h-11 items-center rounded-chip px-3 text-[13px] font-semibold text-ink no-underline hover:bg-surface-4 hover:text-ink"
                >
                  {f.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
