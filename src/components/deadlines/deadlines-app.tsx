"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusChip } from "@/components/ui/status-chip";
import { useAuthUser } from "@/lib/client/auth-store";
import { setReminder, useReminders } from "@/lib/client/reminder-store";
import { useSaved } from "@/lib/client/saved-store";
import type { Scholarship } from "@/lib/content/types";
import { deadlineView, scholarshipHref } from "@/lib/format";
import { authAvailable } from "@/lib/supabase/browser";
import { formatDate } from "@/lib/verification";
import { calendarMonth, deadlineEvents, MONTHS, MONTHS_SHORT, type CalendarEvent } from "@/lib/deadlines";

type Props = { scholarships: Scholarship[]; destNames: Record<string, string>; today: string };

const HEAD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DeadlinesApp({ scholarships, destNames, today }: Props) {
  const saved = useSaved();
  const reminders = useReminders();
  const user = useAuthUser();
  const [view, setView] = useState<"month" | "list">("month");
  const [offset, setOffset] = useState(0);
  const [selDay, setSelDay] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; login?: boolean } | null>(null);

  const events = deadlineEvents(scholarships, saved, today);
  const month = calendarMonth(today, offset, events);
  const inMonth = month.days.flatMap((d) => d.events);
  const dayList = (selDay ? month.days[selDay - 1].events : inMonth).slice().sort((a, b) => a.s.closes.localeCompare(b.s.closes));

  const toggleReminder = (e: CalendarEvent, on: boolean) => {
    if (!authAvailable || !user) {
      setMessage({ text: "Reminders are emailed, so they need an account.", login: true });
      return;
    }
    setReminder(e.s.id, !on);
    setMessage(on ? { text: `Reminder off for ${e.s.name}.` } : { text: `Reminder set. We'll email you 7 days before ${formatDate(e.s.closes)}.` });
  };

  const row = (e: CalendarEvent, withStatus: boolean) => (
    <EventRow
      key={e.s.id}
      e={e}
      today={today}
      destName={destNames[e.s.destinationCode] ?? e.s.destinationCode}
      withStatus={withStatus}
      reminderOn={Boolean(user) && reminders.includes(e.s.id)}
      onReminder={toggleReminder}
    />
  );

  const groups: { label: string; items: CalendarEvent[] }[] = [];
  for (const e of [...events].sort((a, b) => Number(a.closed) - Number(b.closed) || a.s.closes.localeCompare(b.s.closes))) {
    const [y, m] = e.s.closes.split("-").map(Number);
    const label = `${MONTHS[m - 1]} ${y}`;
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(e);
    else groups.push({ label, items: [e] });
  }

  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-5 px-1 pt-[clamp(24px,4vw,48px)] pb-[clamp(16px,3vw,24px)]">
        <div>
          <p className="m-0 mb-3 text-xs font-semibold uppercase tracking-[.08em] text-teal">Saved and featured scholarships</p>
          <h1 className="m-0 font-heading text-[clamp(36px,4.8vw,60px)] leading-[1.03] font-semibold tracking-[-.02em]">Deadlines</h1>
        </div>
        <div role="group" aria-label="View" className="flex rounded-pill bg-surface p-[5px]">
          {(["month", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`min-h-11 rounded-pill border-0 px-[22px] text-xs font-semibold uppercase tracking-[.05em] ${
                view === v ? "bg-navy text-white" : "bg-transparent text-ink hover:bg-surface-4"
              }`}
            >
              {v === "month" ? "Month" : "List"}
            </button>
          ))}
        </div>
      </section>

      <div role="status" className={message ? "mb-4 rounded-input bg-tint-bg px-4 py-3 text-sm text-tint-fg" : "sr-only"}>
        {message?.text}
        {message?.login && (
          <>
            {" "}
            <Link href="/login?next=/deadlines" className="font-bold text-tint-fg">
              Log in
            </Link>{" "}
            or{" "}
            <Link href="/register?next=/deadlines" className="font-bold text-tint-fg">
              register
            </Link>
            .
          </>
        )}
      </div>

      {view === "month" ? (
        <>
          <section aria-labelledby="cal-title" className="rounded-card-lg bg-surface p-[clamp(10px,2.4vw,28px)]">
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
              <h2 id="cal-title" className="m-0 font-heading text-2xl font-semibold" aria-live="polite">
                {MONTHS[month.month]} {month.year}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="mr-2.5 flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="block size-2.5 rounded-[3px] bg-navy" />
                    Saved
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="block size-2.5 rounded-[3px] border border-gold-pressed bg-closing-bg" />
                    Featured
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOffset((o) => o - 1);
                    setSelDay(null);
                  }}
                  aria-label="Previous month"
                  className="size-11 rounded-full border-[1.5px] border-border-input bg-surface text-base font-semibold hover:bg-surface-4"
                >
                  <span aria-hidden="true">‹</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOffset(0);
                    setSelDay(null);
                  }}
                  className="h-11 rounded-pill border-[1.5px] border-border-input bg-surface px-4 text-[11px] font-bold uppercase tracking-[.05em] hover:bg-surface-4"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOffset((o) => o + 1);
                    setSelDay(null);
                  }}
                  aria-label="Next month"
                  className="size-11 rounded-full border-[1.5px] border-border-input bg-surface text-base font-semibold hover:bg-surface-4"
                >
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {HEAD.map((h) => (
                <div key={h} aria-hidden="true" className="px-1 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[.06em] text-muted">
                  <span className="md:hidden">{h[0]}</span>
                  <span className="hidden md:inline">{h}</span>
                </div>
              ))}
              {Array.from({ length: month.lead }, (_, i) => (
                <div key={`b${i}`} aria-hidden="true" />
              ))}
              {month.days.map((d) => {
                const sel = selDay === d.day;
                const has = d.events.length > 0;
                const label = `${d.day} ${MONTHS[month.month]}${d.isToday ? ", today" : ""}${has ? `, ${d.events.length} deadline${d.events.length > 1 ? "s" : ""}` : ""}`;
                return (
                  <button
                    key={d.day}
                    type="button"
                    aria-label={label}
                    aria-pressed={sel}
                    onClick={() => setSelDay(sel ? null : d.day)}
                    className={`flex min-h-[52px] min-w-0 flex-col gap-1 overflow-hidden rounded-input border-[1.5px] p-1.5 text-left md:min-h-[108px] ${
                      sel ? "border-teal bg-tint-bg" : d.isToday ? "border-navy" : has ? "border-border" : "border-transparent"
                    } ${sel ? "" : has ? "bg-surface" : "bg-surface-3"}`}
                  >
                    <span className="text-[13px] font-semibold text-ink tabular-nums">{d.day}</span>
                    {has && (
                      <>
                        <span aria-hidden="true" className="block size-[7px] rounded-full bg-gold-pressed md:hidden" />
                        <span aria-hidden="true" className="hidden flex-col gap-1 md:flex">
                          {d.events.slice(0, 2).map((e) => (
                            <span
                              key={e.s.id}
                              className={`block max-w-full truncate rounded-[6px] px-1.5 py-[3px] text-[11px] leading-[1.3] font-semibold ${
                                e.saved ? "bg-navy text-white" : "bg-closing-bg text-warning-fg"
                              }`}
                            >
                              {e.s.name}
                            </span>
                          ))}
                          {d.events.length > 2 && (
                            <span className="block rounded-[6px] bg-surface-4 px-1.5 py-[3px] text-[11px] font-semibold text-ink">+{d.events.length - 2} more</span>
                          )}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
          <section aria-labelledby="day-title" className="mt-4 rounded-card-lg bg-surface p-[clamp(16px,2.4vw,28px)]">
            <h2 id="day-title" className="m-0 mb-1.5 font-heading text-xl font-semibold">
              {selDay ? `${selDay} ${MONTHS[month.month]}` : `All deadlines in ${MONTHS[month.month]}`}
            </h2>
            {dayList.length === 0 ? (
              <p className="m-0 mt-2 text-sm text-muted">No deadlines on this date.</p>
            ) : (
              <ul className="m-0 list-none p-0">{dayList.map((e) => row(e, false))}</ul>
            )}
          </section>
        </>
      ) : (
        <section aria-label="All deadlines" className="rounded-card-lg bg-surface p-[clamp(16px,2.4vw,28px)]">
          {groups.map((g) => (
            <div key={g.label}>
              <h2 className="m-0 mt-[18px] mb-1 font-heading text-xl font-semibold first:mt-0">{g.label}</h2>
              <ul className="m-0 list-none p-0">{g.items.map((e) => row(e, true))}</ul>
            </div>
          ))}
        </section>
      )}
      <p className="m-0 mx-1 mt-3 text-xs text-muted">Reminders are emailed 7 days before each closing date. Always confirm deadlines on the official website.</p>
    </>
  );
}

function EventRow({
  e,
  today,
  destName,
  withStatus,
  reminderOn,
  onReminder,
}: {
  e: CalendarEvent;
  today: string;
  destName: string;
  withStatus: boolean;
  reminderOn: boolean;
  onReminder: (e: CalendarEvent, on: boolean) => void;
}) {
  const d = deadlineView(e.s, today);
  const [, m, day] = e.s.closes.split("-").map(Number);
  return (
    <li className={`grid grid-cols-[56px_minmax(0,1fr)] items-center gap-3.5 border-t border-border py-3.5 ${d.closed ? "text-muted" : ""}`}>
      <div aria-hidden="true" className="rounded-segment bg-surface-2 py-2 text-center">
        <p className="m-0 font-heading text-[22px] leading-none font-bold tabular-nums">{day}</p>
        <p className="m-0 mt-0.5 text-[11px] font-semibold uppercase text-muted">{MONTHS_SHORT[m - 1]}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`text-[15px] font-semibold ${d.closed ? "" : "text-ink"}`}>{e.s.name}</span>
            {withStatus && <StatusChip status={d.status} />}
          </span>
          <span className="text-[13px] text-muted">
            <span className="sr-only">Closes {d.closeText}. </span>
            {e.saved ? "Saved" : "Featured"} · {destName} · {d.daysText}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {!d.closed && (
            <button
              type="button"
              role="switch"
              aria-checked={reminderOn}
              aria-label={`Remind me: ${e.s.name}`}
              onClick={() => onReminder(e, reminderOn)}
              className={`flex min-h-11 items-center gap-2.5 rounded-pill border-[1.5px] py-0 pr-1.5 pl-3.5 text-[13px] font-semibold ${
                reminderOn ? "border-teal bg-tint-bg text-tint-fg" : "border-border-input bg-surface text-ink"
              }`}
            >
              Remind me
              <span aria-hidden="true" className={`relative block h-[22px] w-9 rounded-pill ${reminderOn ? "bg-teal" : "bg-muted"}`}>
                <span className={`absolute top-[3px] block size-4 rounded-full bg-white transition-[left] duration-150 motion-reduce:transition-none ${reminderOn ? "left-[17px]" : "left-[3px]"}`} />
              </span>
            </button>
          )}
          <Link
            href={scholarshipHref(e.s.id)}
            aria-label={`Details: ${e.s.name}`}
            className="flex min-h-11 items-center rounded-pill bg-navy px-4 text-[11px] font-bold uppercase tracking-[.05em] text-white no-underline hover:bg-ink hover:text-white"
          >
            Details
          </Link>
        </div>
      </div>
    </li>
  );
}
