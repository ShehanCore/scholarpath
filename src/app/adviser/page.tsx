import type { Metadata } from "next";
import Link from "next/link";
import { Detail, ProsePage } from "@/components/prose-page";
import { siteInfo } from "@/lib/site-info";

export const metadata: Metadata = {
  title: "Talk to an adviser",
  description: "Get help with your scholarship application from a ScholarPath adviser.",
};

const contactHref = (c: string) => (c.includes("@") && !c.startsWith("http") ? `mailto:${c}` : c);

export default function AdviserPage() {
  return (
    <ProsePage
      eyebrow="Support"
      title="Talk to an adviser"
      intro="Stuck on an application? An adviser can help you choose where to apply and strengthen what you send."
    >
      <h2>What an adviser can help with</h2>
      <ul>
        <li>Choosing scholarships that fit your study plans and background</li>
        <li>Personal statements, academic CVs and research proposals</li>
        <li>Finding and approaching a potential supervisor</li>
        <li>Interview preparation</li>
      </ul>

      <h2>Before you get in touch</h2>
      <p>
        Run the <Link href="/checklist">pre-submission checklist</Link> for your scholarship and use “Share with mentor” to
        send your summary. It helps an adviser see where you are.
      </p>

      <h2>How to reach us</h2>
      <p>
        <Detail value={siteInfo.adviserContact}>
          <a href={contactHref(siteInfo.adviserContact)} target={siteInfo.adviserContact.startsWith("http") ? "_blank" : undefined} rel="noopener">
            Contact an adviser
          </a>
        </Detail>
      </p>
      <p>Advisers give guidance only. Funding is never guaranteed, and the funder makes every decision.</p>
    </ProsePage>
  );
}
