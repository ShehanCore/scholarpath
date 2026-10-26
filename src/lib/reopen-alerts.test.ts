import { describe, expect, it } from "vitest";
import { designScholarships } from "./content/design-data";
import { dueAlerts, normaliseEmail, reopenEmail } from "./reopen-alerts";

const chevening = designScholarships().find((s) => s.id === "chevening")!;
const alert = { id: 1, scholarshipId: "chevening", email: "a@b.lk", token: "t" };

describe("dueAlerts", () => {
  it("waits while the scholarship is still closed", () => {
    expect(dueAlerts([alert], [chevening], "2026-10-26")).toEqual([]);
  });
  it("is due once new dates are published, upcoming or open", () => {
    const reopened = { ...chevening, opens: "2027-08-03", closes: "2027-10-05" };
    expect(dueAlerts([alert], [reopened], "2026-11-01")).toHaveLength(1); // upcoming
    expect(dueAlerts([alert], [reopened], "2027-09-01")).toHaveLength(1); // open
  });
  it("ignores alerts for scholarships no longer listed", () => {
    expect(dueAlerts([{ ...alert, scholarshipId: "gone" }], [chevening], "2027-09-01")).toEqual([]);
  });
});

describe("reopenEmail", () => {
  const reopened = { ...chevening, opens: "2027-08-03", closes: "2027-10-05" };
  const mail = reopenEmail(reopened, "2026-11-01", "https://scholarpath.lk", "tok");
  it("states the new dates and sends people to the official website", () => {
    expect(mail.subject).toBe("Chevening Scholarships: new dates published");
    expect(mail.text).toContain("Applications open 3 Aug 2027 and close 5 Oct 2027.");
    expect(mail.text).toContain(chevening.officialUrl);
    expect(mail.text).toContain("Funding is never guaranteed.");
    expect(mail.unsubscribe).toBe("https://scholarpath.lk/alerts/unsubscribe?token=tok");
  });
  it("never promises funding", () => {
    expect(mail.text + mail.html).not.toMatch(/you will get|guaranteed (funding|scholarship)|secure your|\bwin\b/i);
  });
  it("escapes HTML", () => {
    const evil = reopenEmail({ ...reopened, name: "<b>x</b>" }, "2026-11-01", "https://s.lk", "t");
    expect(evil.html).toContain("&lt;b&gt;x&lt;/b&gt;");
  });
});

describe("normaliseEmail", () => {
  it("accepts and lower-cases valid addresses", () => expect(normaliseEmail("  Amaya@Example.LK ")).toBe("amaya@example.lk"));
  it("rejects invalid ones", () => {
    expect(normaliseEmail("amaya")).toBeNull();
    expect(normaliseEmail("a@b")).toBeNull();
    expect(normaliseEmail("a b@c.lk")).toBeNull();
  });
});
