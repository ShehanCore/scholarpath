import { describe, expect, it } from "vitest";
import type { Checklist } from "./checklist";
import {
  answersToIndexes,
  outreachToRow,
  rowToOutreach,
  checklistToItemRows,
  diffIds,
  indexesToAnswers,
  itemRowsToChecklist,
  mergeChecklists,
  mergeEligibility,
  mergeSaved,
} from "./sync";

const ck = (p: Partial<Checklist>): Checklist => ({ type: "scholarship", level: "M", items: {}, notes: {}, ...p });

describe("sync merges", () => {
  it("unions saved and uploads only what's new", () => {
    expect(mergeSaved(["a", "b"], ["b", "c"])).toEqual({ all: ["b", "c", "a"], toUpload: ["a"] });
  });
  it("unions eligibility answers", () => {
    expect(mergeEligibility({ x: [2, 0] }, { x: [1], y: [0] })).toEqual({ x: [0, 1, 2], y: [0] });
  });
  it("prefers this device's answers per item, keeps the account's others", () => {
    const merged = mergeChecklists(
      { chevening: ck({ items: { A0: "done" }, notes: { A0: "", A1: "local" } }), gates: ck({}) },
      { chevening: ck({ level: "P", items: { A0: "needs", B0: "done" }, notes: { A0: "remote" } }), daad: ck({ type: "grant" }) },
    );
    expect(merged.chevening).toEqual(ck({ items: { A0: "done", B0: "done" }, notes: { A0: "remote", A1: "local" } }));
    expect(Object.keys(merged).sort()).toEqual(["chevening", "daad", "gates"]);
  });
  it("round-trips checklist items and eligibility answers", () => {
    const c = ck({ items: { A0: "done", D1: "needs" }, notes: { D1: "add example", B0: "note only", C0: "" } });
    const rows = checklistToItemRows(c);
    expect(rows).toEqual([
      { item_id: "A0", state: "done", note: null },
      { item_id: "B0", state: null, note: "note only" },
      { item_id: "D1", state: "needs", note: "add example" },
    ]);
    expect(itemRowsToChecklist({ type: "scholarship", level: "M" }, rows)).toEqual(ck({ items: c.items, notes: { D1: "add example", B0: "note only" } }));
    expect(answersToIndexes(indexesToAnswers([3, 0]))).toEqual([0, 3]);
  });
  it("diffs saved snapshots", () => expect(diffIds(["a", "b"], ["b", "c"])).toEqual({ added: ["c"], removed: ["a"] }));
});

describe("outreach rows", () => {
  it("round-trips an entry through the database row", () => {
    const e = {
      id: "6f1c0a9e-0000-4000-8000-000000000001",
      scholarshipId: "chevening",
      to: "professor" as const,
      university: "UCL",
      name: "Professor Silva",
      email: "silva@ucl.ac.uk",
      purpose: "supervision" as const,
      subject: "Prospective student",
      sentAt: "2026-10-22",
      status: "awaiting" as const,
    };
    expect(rowToOutreach({ ...outreachToRow(e), sent_at: "2026-10-22T00:00:00+00:00" })).toEqual(e);
    expect(outreachToRow({ ...e, name: "", email: "" })).toMatchObject({ recipient_name: null, recipient_email: null });
  });
});
