import Image from "next/image";
import Link from "next/link";
import type { DestinationStats } from "@/lib/content/derive";
import type { Destination } from "@/lib/content/types";
import { destinationChip, destinationHref, formatDate } from "@/lib/format";
import { DestinationVideo } from "./destination-media";

const VIDEO_CODES = ["GB", "US", "CA", "AU", "JP", "EU", "DE", "NL"];
const KB = ["kbPanR 22s", "kbOut 18s", "kbIn 20s", "kbRise 19s", "kbPanL 21s"];

export function destinationImage(code: string) {
  return code === "GB" ? "/assets/dest-gb-v3.png" : `/assets/dest-${code.toLowerCase()}-v2.png`;
}

export function DestinationCard({
  d,
  stats,
  index,
  video = false,
  headingLevel = 3,
  priority = false,
}: {
  d: Destination;
  stats: DestinationStats;
  index: number;
  video?: boolean;
  headingLevel?: 2 | 3;
  priority?: boolean;
}) {
  const H = `h${headingLevel}` as const;
  const europe = d.code === "EU";
  return (
    <Link
      href={destinationHref(d.code)}
      className="group flex flex-col overflow-hidden rounded-card-md border border-border bg-surface text-ink no-underline hover:border-navy hover:text-ink"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-border">
        <div
          data-kb
          className="absolute inset-0 will-change-transform"
          style={{ animation: `${KB[index % KB.length]} ease-in-out infinite alternate` }}
        >
          <Image
            src={destinationImage(d.code)}
            alt=""
            fill
            sizes="(min-width: 1380px) 330px, (min-width: 860px) 33vw, 100vw"
            priority={priority}
            className="object-cover"
          />
        </div>
        {video && VIDEO_CODES.includes(d.code) && <DestinationVideo src={`/assets/dest-${d.code.toLowerCase()}.mp4`} />}
        <span className="pointer-events-none absolute top-3 left-3 flex h-6 items-center rounded-[6px] bg-surface px-2 font-mono text-[11px] font-medium text-ink">
          {destinationChip(d.code)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <H className="m-0 font-heading text-[19px] font-semibold">{d.name}</H>
        <p className="m-0 text-[13px] leading-normal text-pretty text-muted">{d.why}</p>
        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border pt-2.5">
          <div>
            <p className="m-0 font-heading text-lg font-bold">{stats.openScholarships}</p>
            <p className="m-0 text-xs text-muted">open scholarships</p>
          </div>
          <div>
            <p className="m-0 font-heading text-lg font-bold">{europe ? "—" : stats.rankedUniversities}</p>
            <p className="m-0 text-xs text-muted">{europe ? "spans several countries" : "THE-ranked listed"}</p>
          </div>
        </div>
        <p className="m-0 text-xs">
          <span className="text-muted">Next deadline</span>{" "}
          {stats.nextDeadline ? formatDate(stats.nextDeadline) : "None listed"}
        </p>
      </div>
    </Link>
  );
}
