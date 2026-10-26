import { expect, it } from "vitest";
import { reminderEmail, reminderTarget } from "./deadline-reminders";

it("targets deadlines 7 days away", () => {
  expect(reminderTarget("2026-10-26")).toBe("2026-11-02");
  expect(reminderTarget("2026-12-28")).toBe("2027-01-04");
});

it("writes a reminder that points to the official website and never promises funding", () => {
  const m = reminderEmail(
    { id: "daad", name: "DAAD <EPOS>", closes: "2026-11-02", officialUrl: "https://www.daad.de/" },
    "https://scholarpath.lk",
    "6f1c0a9e-0000-4000-8000-000000000001",
  );
  expect(m.subject).toBe("DAAD <EPOS> closes in 7 days (2 Nov 2026)");
  expect(m.text).toContain("https://www.daad.de/");
  expect(m.text).toContain("Information only. Funding is never guaranteed.");
  expect(m.unsubscribe).toBe("https://scholarpath.lk/alerts/unsubscribe?token=6f1c0a9e-0000-4000-8000-000000000001&type=reminder");
  expect(m.html).toContain("DAAD &lt;EPOS&gt;");
  expect(m.text + m.html).not.toMatch(/guaranteed funding|you will get|secure your|\bwin\b/i);
});
