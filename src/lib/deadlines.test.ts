import { describe, expect, it } from "vitest";
import type { Scholarship } from "@/lib/content/types";
import { calendarMonth, deadlineEvents } from "./deadlines";

const sch = (id: string, opens: string, closes: string) => ({ id, opens, closes }) as Scholarship;
const list = [
  sch("open-soon", "2026-08-01", "2026-11-05"),
  sch("far", "2026-08-01", "2027-08-01"),
  sch("closed", "2026-01-01", "2026-10-01"),
  sch("upcoming", "2026-11-01", "2027-01-15"),
];

describe("deadlineEvents", () => {
  it("features open and upcoming awards closing within 200 days, plus everything saved", () => {
    const e = deadlineEvents(list, ["closed"], "2026-10-26");
    expect(e.map((x) => [x.s.id, x.saved, x.closed])).toEqual([
      ["open-soon", false, false],
      ["closed", true, true],
      ["upcoming", false, false],
    ]);
  });
});

describe("calendarMonth", () => {
  it("lays out October 2026 Monday-first with today marked", () => {
    const m = calendarMonth("2026-10-26", 0, deadlineEvents(list, ["closed"], "2026-10-26"));
    expect([m.year, m.month, m.lead, m.days.length]).toEqual([2026, 9, 3, 31]);
    expect(m.days[25].isToday).toBe(true);
    expect(m.days[0].events.map((e) => e.s.id)).toEqual(["closed"]);
  });
  it("moves across years", () => {
    const m = calendarMonth("2026-10-26", 3, deadlineEvents(list, [], "2026-10-26"));
    expect([m.year, m.month, m.lead]).toEqual([2027, 0, 4]);
    expect(m.days[14].events.map((e) => e.s.id)).toEqual(["upcoming"]);
    expect(m.days.some((d) => d.isToday)).toBe(false);
  });
});
