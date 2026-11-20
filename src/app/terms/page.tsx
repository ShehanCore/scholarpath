import type { Metadata } from "next";
import Link from "next/link";
import { Detail, ProsePage } from "@/components/prose-page";
import { INACTIVE_LABEL } from "@/lib/inactive-accounts";
import { siteInfo } from "@/lib/site-info";
import { formatDate } from "@/lib/verification";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using ScholarPath: information only, your account, emails you send, and our responsibilities.",
};

export default function TermsPage() {
  return (
    <ProsePage
      eyebrow="Terms"
      title="Terms of use"
      intro={`By using ScholarPath or creating an account, you agree to these terms. Last updated ${formatDate(siteInfo.privacyUpdated)}.`}
    >
      <h2>Who we are</h2>
      <p>
        ScholarPath is run by <Detail value={siteInfo.legalName} />, <Detail value={siteInfo.address} />.
      </p>

      <h2>Information only</h2>
      <ul>
        <li>ScholarPath helps you find scholarships and prepare applications. We don&apos;t award scholarships or decide who receives them.</li>
        <li>Funding is never guaranteed. Every decision is made by the funder or university.</li>
        <li>
          We check records against official websites, but details change. Always verify dates, eligibility and funding on
          the official website before you apply. See <Link href="/how-we-verify">how we verify scholarships</Link>.
        </li>
        <li>We aren&apos;t affiliated with the funders, universities or ranking organisations we list, unless we say so.</li>
      </ul>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate details, including a WhatsApp number you use, and keep your password private.</li>
        <li>One account per person. If you&apos;re under 18, ask a parent or guardian before you register.</li>
        <li>You can delete your account at any time from your account page.</li>
        <li>Accounts that aren&apos;t used for {INACTIVE_LABEL} are deleted after an email warning (see the <Link href="/privacy">privacy notice</Link>).</li>
      </ul>

      <h2>Emails you write</h2>
      <ul>
        <li>
          Emails to universities and professors open in your own email account. ScholarPath never sends them for you, and
          you&apos;re responsible for what you send.
        </li>
        <li>
          AI drafts can contain mistakes. Check every fact and replace anything in [brackets] before you send. Drafts are
          limited to 20 a day.
        </li>
        <li>Be polite and specific, and don&apos;t send the same message to many people.</li>
      </ul>

      <h2>Fair use</h2>
      <p>Please don&apos;t:</p>
      <ul>
        <li>use ScholarPath to send spam or harass anyone;</li>
        <li>pretend to be someone else, or register for someone without their permission;</li>
        <li>copy ScholarPath&apos;s content in bulk, or try to break, overload or get around its security or limits.</li>
      </ul>
      <p>We may suspend or delete accounts that break these terms.</p>

      <h2>Our responsibility</h2>
      <p>
        We work to keep ScholarPath accurate and available, but we can&apos;t promise it&apos;s always error-free or online. As far
        as the law allows, we aren&apos;t responsible for losses from relying on information here, missed deadlines, or
        decisions made by funders or universities. Nothing in these terms limits rights you have under Sri Lankan law.
      </p>

      <h2>Changes and law</h2>
      <p>
        If we change these terms, we&apos;ll update the date at the top and tell signed-in users about important changes. These
        terms are governed by the laws of Sri Lanka.
      </p>

      <h2>Contact</h2>
      <p>
        <Detail value={siteInfo.contactEmail}>
          <a href={`mailto:${siteInfo.contactEmail}`}>{siteInfo.contactEmail}</a>
        </Detail>
      </p>
    </ProsePage>
  );
}
