import { describe, expect, it } from "vitest";
import { RANK_TO_CONFIRM, byRank, normaliseTheRank, parseRank, rankLabel, rankSortKey } from "./rank";

describe("rank", () => {
  it("labels unknown ranks", () => expect(rankLabel({ rankDisplay: null })).toBe(RANK_TO_CONFIRM));
  it("keeps ties and bands as published", () => {
    expect(rankLabel({ rankDisplay: "=17" })).toBe("=17");
    expect(normaliseTheRank(" 301-350 ")).toBe("301–350");
    expect(normaliseTheRank("1501+")).toBe("1501+");
    expect(normaliseTheRank("=17")).toBe("=17");
  });
  it("rejects anything that isn't a THE rank", () => {
    expect(normaliseTheRank("about 20")).toBeNull();
    expect(normaliseTheRank("Reporter")).toBeNull();
    expect(normaliseTheRank("")).toBeNull();
  });
  it("sorts ascending with unranked last", () => {
    const list = [
      { name: "B", rankSort: null },
      { name: "C", rankSort: 301 },
      { name: "D", rankSort: 17 },
      { name: "A", rankSort: null },
      { name: "E", rankSort: 5 },
    ];
    expect(list.sort(byRank).map((u) => u.name)).toEqual(["E", "D", "C", "A", "B"]);
    expect(rankSortKey(null)).toBe(Number.POSITIVE_INFINITY);
  });
  it("parses into display and sort fields", () => {
    expect(parseRank("=17")).toEqual({ rankDisplay: "=17", rankSort: 17 });
    expect(parseRank("301-350")).toEqual({ rankDisplay: "301–350", rankSort: 301 });
    expect(parseRank("Rank band: to confirm")).toBeNull();
  });
});
