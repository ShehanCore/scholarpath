import type { Metadata } from "next";
import Link from "next/link";
import { Detail, ProsePage } from "@/components/prose-page";
import { siteInfo } from "@/lib/site-info";
import { formatDate } from "@/lib/verification";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "What ScholarPath collects, why, who processes it, how long it's kept, and your rights under Sri Lanka's Personal Data Protection Act.",
};

const email = (e: string) => (
  <Detail value={e}>
    <a href={`mailto:${e}`}>{e}</a>
  </Detail>
);

export default function PrivacyPage() {
  return (
    <ProsePage
      eyebrow="Privacy"
      title="Privacy notice"
      intro={`How ScholarPath handles your personal data, in line with Sri Lanka's Personal Data Protection Act. Last updated ${formatDate(siteInfo.privacyUpdated)}.`}
    >
      <h2>Who we are</h2>
      <p>
        ScholarPath is run by <Detail value={siteInfo.legalName} />, <Detail value={siteInfo.address} />. For anything about
        your data, contact {email(siteInfo.privacyEmail)}.
      </p>

      <h2>What we collect and why</h2>
      <dl>
        <dt>Your account</dt>
        <dd>
          Name, email address, password (stored only in a scrambled form), and whether you&apos;re a student, parent or adviser.
          Used to sign you in and keep your work. If you choose to sign in with Google, Google shares your name and email
          with us.
        </dd>
        <dt>Your WhatsApp number</dt>
        <dd>
          Required to register, so we can contact you about your account. We send WhatsApp messages (scholarship updates
          and deadline reminders) only if you tick the opt-in box. We record when you opt in and out. Reply STOP or untick
          the box on your account page to stop.
        </dd>
        <dt>Your study plans</dt>
        <dd>Levels, subjects, destinations, nationality and intake. Used to show scholarships that may match you.</dd>
        <dt>What you do on ScholarPath</dt>
        <dd>
          Saved scholarships, eligibility answers, checklist progress and notes, and deadline reminders. Used to keep them
          on all your devices and to send the reminders you switch on.
        </dd>
        <dt>Your email log</dt>
        <dd>
          When you open an email to a university or professor in your own mail app, we record who it was to (office, or the
          professor&apos;s name and email address you typed), the university, the purpose, the subject line and the date. We
          don&apos;t keep the message itself. Used to show your email tracker and follow-up reminders. ScholarPath never sends
          these emails for you.
        </dd>
        <dt>AI email drafts</dt>
        <dd>
          Only when you press “Draft with AI”, we send the scholarship&apos;s details, who you&apos;re writing to, the university,
          the professor&apos;s name and research topic you typed, your name and your checklist notes to Anthropic to write the
          draft. We don&apos;t store the draft, only a daily count to apply the limit of 20 drafts a day.
        </dd>
        <dt>“Notify me when it reopens”</dt>
        <dd>
          Your email address and the scholarship, with the time you agreed. Used to send one email when new dates are
          published. You don&apos;t need an account. Every email has a link to stop.
        </dd>
        <dt>On your device</dt>
        <dd>
          If you&apos;re not signed in, saved scholarships, comparisons and checklist answers are kept only in your browser.
          Signing in uses cookies to keep you signed in. We don&apos;t use advertising cookies.
        </dd>
      </dl>

      <h2>Who processes your data for us</h2>
      <p>These services store or process data on our behalf, on servers outside Sri Lanka:</p>
      <ul>
        <li>Supabase: database and sign-in</li>
        <li>Vercel: hosting the website</li>
        <li>Resend: sending reminder and alert emails</li>
        <li>Anthropic: AI email drafts, only when you ask for one</li>
        <li>Google: sign-in, only if you choose “Continue with Google”</li>
        <li>Meta (WhatsApp): WhatsApp messages, only if you opt in</li>
      </ul>
      <p>We don&apos;t sell your data or share it for advertising.</p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Your account and everything linked to it: until you delete your account.</li>
        <li>
          Accounts nobody signs in to: deleted after{" "}
          <Detail value={siteInfo.inactiveAccountMonths}>{siteInfo.inactiveAccountMonths} months</Detail> without a sign-in.
        </li>
        <li>“Notify me” requests: until you stop the alert or ask us to delete it.</li>
      </ul>

      <h2>Your rights</h2>
      <ul>
        <li>
          <strong>Get a copy of your data:</strong> “Download my data” on your <Link href="/account">account page</Link>.
        </li>
        <li>
          <strong>Correct it:</strong> edit your details on your account page.
        </li>
        <li>
          <strong>Delete it:</strong> “Delete my account” on your account page removes your account and everything linked to it.
        </li>
        <li>
          <strong>Withdraw consent:</strong> reply STOP on WhatsApp, untick WhatsApp updates on your account page, or use the
          stop link in any email.
        </li>
        <li>
          <strong>Ask or complain:</strong> contact {email(siteInfo.privacyEmail)}. If you&apos;re not satisfied, you can complain
          to the Data Protection Authority of Sri Lanka.
        </li>
      </ul>

      <h2>Changes</h2>
      <p>If we change this notice, we&apos;ll update the date at the top and tell signed-in users about important changes.</p>
    </ProsePage>
  );
}
