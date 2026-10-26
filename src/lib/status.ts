import type { Scholarship } from "@/lib/content/types";

export type DeadlineStatus = "Open" | "Closing soon" | "Upcoming" | "Closed";

/** Days from `today` to the closing date (0 on the closing day). */
export function daysLeft(closes: string, today: string): number {
  return Math.round((Date.parse(closes) - Date.parse(today)) / 86_400_000);
}

/**
 * Deadline status from design/README.md "Deadline status". `today` is an ISO date (YYYY-MM-DD) for the
 * real current date — use `todayIso()`; never hard-code the prototype's 22 Oct 2026.
 */
export function statusOf(s: Pick<Scholarship, "opens" | "closes">, today: string): DeadlineStatus {
  if (s.closes < today) return "Closed";
  if (s.opens > today) return "Upcoming";
  if (daysLeft(s.closes, today) <= 30) return "Closing soon";
  return "Open";
}

/** Today's date in Sri Lanka (UTC+5:30), as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(now);
}

const sortGroup: Record<DeadlineStatus, number> = { "Closing soon": 0, Open: 0, Upcoming: 1, Closed: 2 };

/** The prototype's "Closing soon" sort: open first, then upcoming, closed last; each by closing date. */
export function byDeadline(today: string) {
  return (a: Pick<Scholarship, "opens" | "closes">, b: Pick<Scholarship, "opens" | "closes">) =>
    sortGroup[statusOf(a, today)] - sortGroup[statusOf(b, today)] || a.closes.localeCompare(b.closes);
}
