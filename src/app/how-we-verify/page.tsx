import type { Metadata } from "next";
import Link from "next/link";
import { Detail, ProsePage } from "@/components/prose-page";
import { siteInfo } from "@/lib/site-info";

export const metadata: Metadata = {
  title: "How we verify scholarships",
  description: "How ScholarPath checks scholarship dates against official websites, and what each verification label means.",
};

export default function HowWeVerifyPage() {
  return (
    <ProsePage
      eyebrow="Our data"
      title="How we verify scholarships"
      intro="Every scholarship on ScholarPath comes from its official website. We tell you how recently we checked it, and we never fill gaps with guesses."
    >
      <h2>Where the information comes from</h2>
      <p>
        Each record is copied from the funder&apos;s or university&apos;s official website: dates, eligibility, required
        documents and the selection timeline. Every scholarship page links to that official website. Always verify on the
        official website before you apply: funders change details without notice.
      </p>

      <h2>What the labels mean</h2>
      <dl>
        <dt>Dates checked (with a date)</dt>
        <dd>We compared the dates with the official website on that day, using the published information for the coming cycle.</dd>
        <dt>Dates expected · to confirm</dt>
        <dd>The funder hasn&apos;t published this cycle&apos;s dates yet, or we couldn&apos;t confirm them. The dates follow last year&apos;s pattern and may change.</dd>
        <dt>Details to confirm</dt>
        <dd>A detail still needs a person to check it, for example whether Sri Lanka is still on the eligible country list.</dd>
        <dt>Sample data</dt>
        <dd>Example content that hasn&apos;t been verified.</dd>
      </dl>

      <h2>What we don&apos;t publish</h2>
      <ul>
        <li>
          <strong>Funding amounts and what a scholarship covers.</strong> These change often and differ by course and
          country. Each page links to the official website for funding details.
        </li>
        <li>
          <strong>Anything we couldn&apos;t confirm.</strong> If a section isn&apos;t published by the funder, the page says
          “Not published” rather than guessing.
        </li>
        <li>
          <strong>Professors&apos; names.</strong> ScholarPath doesn&apos;t list academics. We link to each university&apos;s staff
          directory so you can find the right person yourself.
        </li>
      </ul>

      <h2>Deadlines</h2>
      <p>
        “Open”, “Closing soon” (30 days or less), “Upcoming” and “Closed” are worked out from today&apos;s date in Sri Lanka.
        Closed scholarships stay listed so you can ask to be notified when they reopen. Some funders close at a set time in
        their own time zone, so finish well before the last day.
      </p>

      <h2>How often we check</h2>
      <p>
        We re-check every record before each application cycle, and whenever a funder announces changes. The date of the
        last check is shown on each scholarship page.
      </p>

      <h2>Found a mistake?</h2>
      <p>
        Tell us at{" "}
        <Detail value={siteInfo.contactEmail}>
          <a href={`mailto:${siteInfo.contactEmail}`}>{siteInfo.contactEmail}</a>
        </Detail>{" "}
        with the scholarship name and a link to the official page. We correct confirmed mistakes quickly.
      </p>
      <p>
        ScholarPath gives information only. Funding is never guaranteed: check your eligibility with the funder. See also our{" "}
        <Link href="/rankings-note">rankings note</Link>.
      </p>
    </ProsePage>
  );
}
