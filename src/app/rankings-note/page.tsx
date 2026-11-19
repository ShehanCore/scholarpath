import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { RANK_ATTRIBUTION, RANK_TO_CONFIRM } from "@/lib/rank";

export const metadata: Metadata = {
  title: "Rankings note",
  description: "Which university ranking ScholarPath shows, how ties and bands appear, and why some universities show “Rank band: to confirm”.",
};

export default function RankingsNotePage() {
  return (
    <ProsePage
      eyebrow="Our data"
      title="Rankings note"
      intro="University ranks on ScholarPath come from one source, shown exactly as published."
    >
      <h2>Which ranking</h2>
      <p>{RANK_ATTRIBUTION}</p>
      <p>
        We use one ranking so universities can be compared on the same basis. We don&apos;t mix in other rankings, estimate
        ranks, or calculate our own. ScholarPath isn&apos;t affiliated with Times Higher Education.
      </p>

      <h2>How ranks appear</h2>
      <ul>
        <li>
          <strong>Ties</strong> keep the published equals sign, for example <code>=17</code>.
        </li>
        <li>
          <strong>Bands</strong> appear as published, for example <code>301–350</code>. Universities in a band are listed by
          the band, then by name.
        </li>
        <li>
          <strong>{RANK_TO_CONFIRM}</strong> means we haven&apos;t recorded a published rank for that university. It doesn&apos;t
          mean the university is unranked or ranked low.
        </li>
      </ul>

      <h2>How often it changes</h2>
      <p>The ranking is published once a year. We update ranks once a year, after the new edition is published.</p>

      <h2>Use ranks with care</h2>
      <p>
        A rank is one signal among many. For a scholarship application, the fit between your plans, the course and the
        supervisor usually matters more. Check what each university offers for your subject.
      </p>
    </ProsePage>
  );
}
