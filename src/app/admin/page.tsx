import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow, Panel } from "@/components/ui/panel";

export const metadata: Metadata = { title: "Admin" };

const tools = [
  ["/admin/scholarships", "Scholarships", "Dates, deadline notes, official links, eligibility and documents, and when each was last checked."],
  ["/admin/rankings", "University ranks", "Times Higher Education ranks, exactly as published. Updated once a year."],
] as const;

export default function AdminHome() {
  return (
    <>
      <section className="px-1 pt-[clamp(24px,4vw,48px)] pb-6">
        <Eyebrow className="mb-3 text-teal">Admin</Eyebrow>
        <h1 className="m-0 font-heading text-[clamp(32px,4vw,48px)] leading-[1.05] font-semibold">Edit ScholarPath</h1>
      </section>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
        {tools.map(([href, title, text]) => (
          <Panel key={href} as="div">
            <h2 className="m-0 font-heading text-2xl font-semibold">
              <Link href={href}>{title}</Link>
            </h2>
            <p className="mt-2 mb-0 text-[15px] leading-[1.6] text-muted">{text}</p>
          </Panel>
        ))}
      </div>
    </>
  );
}
