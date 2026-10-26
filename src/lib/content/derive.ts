import { statusOf } from "@/lib/status";
import type { Destination, Scholarship, University } from "./types";

export type DestinationStats = {
  /** Scholarships for this destination that aren't closed (BUILD_PLAN correction 5: computed, never hard-coded). */
  openScholarships: number;
  /** Universities in this country with a confirmed THE 2027 rank. */
  rankedUniversities: number;
  /** ISO closing date of the next scholarship that isn't closed, or null ("None listed"). */
  nextDeadline: string | null;
};

export function destinationStats(
  destination: Pick<Destination, "code">,
  scholarships: Scholarship[],
  universities: University[],
  today: string,
): DestinationStats {
  const live = scholarships
    .filter((s) => s.destinationCode === destination.code && statusOf(s, today) !== "Closed")
    .map((s) => s.closes)
    .sort();
  return {
    openScholarships: live.length,
    rankedUniversities: universities.filter((u) => u.countryCode === destination.code && u.rankDisplay !== null).length,
    nextDeadline: live[0] ?? null,
  };
}
