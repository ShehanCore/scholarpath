import { describe, expect, it } from "vitest";
import { inactivityEmail, inactivityPlan, type AccountActivity } from "./inactive-accounts";

const acct = (over: Partial<AccountActivity>): AccountActivity => ({
  id: "a",
  email: "a@example.com",
  createdAt: "2026-01-01T00:00:00Z",
  lastSignInAt: null,
  lastSeenAt: null,
  warnedAt: null,
  ...over,
});
const ids = (xs: AccountActivity[]) => xs.map((x) => x.id);

describe("inactivityPlan", () => {
  it("warns 7 days before 6 months without use, not before", () => {
    const p = inactivityPlan(
      [acct({ id: "172", lastSeenAt: "2026-05-31T10:00:00Z" }), acct({ id: "173", lastSeenAt: "2026-05-30T10:00:00Z" })],
      "2026-11-19",
    );
    expect(ids(p.warn)).toEqual(["173"]);
    expect(p.remove).toEqual([]);
  });

  it("counts use, not just sign-in: a student who stays signed in is active", () => {
    const p = inactivityPlan([acct({ lastSignInAt: "2026-03-01T00:00:00Z", lastSeenAt: "2026-11-18T09:00:00Z" })], "2026-11-19");
    expect(p).toEqual({ warn: [], remove: [] });
  });

  it("deletes only after 6 months and at least 7 days after a warning", () => {
    const seen = "2026-04-01T00:00:00Z";
    const p = inactivityPlan(
      [
        acct({ id: "never-warned", lastSeenAt: seen }),
        acct({ id: "warned-3-days-ago", lastSeenAt: seen, warnedAt: "2026-11-16T02:30:00Z" }),
        acct({ id: "warned-7-days-ago", lastSeenAt: seen, warnedAt: "2026-11-12T02:30:00Z" }),
      ],
      "2026-11-19",
    );
    expect(ids(p.warn)).toEqual(["never-warned"]);
    expect(ids(p.remove)).toEqual(["warned-7-days-ago"]);
  });

  it("ignores a warning from before the student came back", () => {
    const p = inactivityPlan([acct({ lastSeenAt: "2026-05-10T00:00:00Z", warnedAt: "2026-04-01T00:00:00Z" })], "2026-11-19");
    expect(p.remove).toEqual([]);
    expect(p.warn).toHaveLength(1);
  });

  it("never deletes an account it couldn't warn (no email)", () => {
    const p = inactivityPlan([acct({ email: null, lastSeenAt: "2026-01-01T00:00:00Z" })], "2026-11-19");
    expect(p).toEqual({ warn: [], remove: [] });
  });
});

it("writes a plain warning email with the deadline", () => {
  const m = inactivityEmail("https://scholarpath.lk", "2026-11-19");
  expect(m.subject).toBe("Your ScholarPath account will be deleted in 7 days");
  expect(m.text).toContain("Sign in before 26 Nov 2026");
  expect(m.text).toContain("https://scholarpath.lk/login");
});
