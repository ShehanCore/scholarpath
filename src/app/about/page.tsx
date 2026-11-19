import type { Metadata } from "next";
import Link from "next/link";
import { Detail, ProsePage } from "@/components/prose-page";
import { siteInfo } from "@/lib/site-info";

export const metadata: Metadata = {
  title: "About",
  description: "ScholarPath helps students in Sri Lanka find scholarships to study abroad and prepare applications they're confident in.",
};

export default function AboutPage() {
  return (
    <ProsePage
      eyebrow="About ScholarPath"
      title="Find the right scholarship and submit an application you're confident in."
      intro="ScholarPath helps students in Sri Lanka find scholarships and research funding to study abroad, then prepare their application."
    >
      <h2>What ScholarPath does</h2>
      <ul>
        <li>
          <strong>Find:</strong> browse scholarships by discipline, study level, destination and university, and combine filters.
        </li>
        <li>
          <strong>Shortlist:</strong> save scholarships, compare up to three, and keep track of deadlines.
        </li>
        <li>
          <strong>Check:</strong> run the pre-submission checklist against what selection committees weigh: fit, evidence,
          clarity, feasibility and impact.
        </li>
        <li>
          <strong>Apply:</strong> submit on the official website, before the deadline.
        </li>
      </ul>

      <h2>What ScholarPath doesn&apos;t do</h2>
      <p>
        We don&apos;t award scholarships, apply on your behalf or send emails for you, and we can&apos;t promise funding. Every
        decision is made by the funder. See <Link href="/how-we-verify">how we verify scholarships</Link>.
      </p>

      <h2>Who runs ScholarPath</h2>
      <p>
        ScholarPath is run by <Detail value={siteInfo.legalName} />, <Detail value={siteInfo.address} />.
      </p>
      <p>
        Contact:{" "}
        <Detail value={siteInfo.contactEmail}>
          <a href={`mailto:${siteInfo.contactEmail}`}>{siteInfo.contactEmail}</a>
        </Detail>
      </p>
    </ProsePage>
  );
}
