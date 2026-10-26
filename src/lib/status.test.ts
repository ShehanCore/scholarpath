import { describe, expect, it } from "vitest";
import { byDeadline, daysLeft, statusOf, todayIso } from "./status";

const s = (opens: string, closes: string) => ({ opens, closes });

describe("statusOf", () => {
  const today = "2026-10-26";
  it("is Closed after the closing date", () => expect(statusOf(s("2026-08-01", "2026-10-25"), today)).toBe("Closed"));
  it("is still open on the closing day", () => expect(statusOf(s("2026-08-01", today), today)).toBe("Closing soon"));
  it("is Upcoming before it opens", () => expect(statusOf(s("2026-10-27", "2027-01-01"), today)).toBe("Upcoming"));
  it("is Closing soon with exactly 30 days left", () =>
    expect(statusOf(s("2026-08-01", "2026-11-25"), today)).toBe("Closing soon"));
  it("is Open with 31 days left", () => expect(statusOf(s("2026-08-01", "2026-11-26"), today)).toBe("Open"));
  it("counts days across a DST change correctly", () => expect(daysLeft("2027-04-01", "2027-03-01")).toBe(31));
});

describe("byDeadline", () => {
  it("puts open first, then upcoming, closed last, each by closing date", () => {
    const today = "2026-10-26";
    const list = [
      { id: "closed", ...s("2026-01-01", "2026-02-01") },
      { id: "upcoming", ...s("2026-12-01", "2027-01-01") },
      { id: "open-late", ...s("2026-01-01", "2027-03-01") },
      { id: "soon", ...s("2026-01-01", "2026-11-01") },
    ];
    expect(list.sort(byDeadline(today)).map((x) => x.id)).toEqual(["soon", "open-late", "upcoming", "closed"]);
  });
});

describe("todayIso", () => {
  it("uses Sri Lanka time", () => {
    // 20:00 UTC on 25 Oct is 01:30 on 26 Oct in Colombo.
    expect(todayIso(new Date("2026-10-25T20:00:00Z"))).toBe("2026-10-26");
  });
});
