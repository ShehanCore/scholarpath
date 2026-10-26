// Deadlines calendar (design/README.md screen 9): saved scholarships plus featured ones, by closing date.
// Pure functions on ISO dates, so the calendar never depends on the device's time zone.
import type { Scholarship } from "@/lib/content/types";
import { daysLeft, statusOf } from "@/lib/status";

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

/** Featured = still open or upcoming and closing within this many days (the prototype's rule). */
export const FEATURED_WITHIN_DAYS = 200;

export type CalendarEvent = { s: Scholarship; saved: boolean; closed: boolean };

/** Saved scholarships (closed ones too) plus featured ones. */
export function deadlineEvents(scholarships: Scholarship[], saved: string[], today: string): CalendarEvent[] {
  return scholarships
    .map((s) => ({ s, saved: saved.includes(s.id), closed: statusOf(s, today) === "Closed" }))
    .filter((e) => e.saved || (!e.closed && daysLeft(e.s.closes, today) <= FEATURED_WITHIN_DAYS));
}

/** The month `offset` months from today's, Monday-first, with each day's deadlines. */
export function calendarMonth(today: string, offset: number, events: CalendarEvent[]) {
  const [ty, tm, td] = today.split("-").map(Number);
  const base = new Date(Date.UTC(ty, tm - 1 + offset, 1));
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const lead = (base.getUTCDay() + 6) % 7;
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const iso = prefix + String(day).padStart(2, "0");
    return {
      day,
      isToday: year === ty && month === tm - 1 && day === td,
      events: events.filter((e) => e.s.closes === iso),
    };
  });
  return { year, month, lead, days };
}
