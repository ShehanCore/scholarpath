import { describe, expect, it } from "vitest";
import { RANK_TO_CONFIRM, byRank, normaliseTheRank, rankLabel, rankSortKey } from "./rank";

describe("rank", () => {
  it("labels unknown ranks", () => expect(rankLabel({ theRank: null })).toBe(RANK_TO_CONFIRM));
  it("keeps ties and bands as published", () => {
    expect(rankLabel({ theRank: "=17" })).toBe("=17");
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
      { name: "B", theRank: null },
      { name: "C", theRank: "301–350" },
      { name: "D", theRank: "=17" },
      { name: "A", theRank: null },
      { name: "E", theRank: "5" },
    ];
    expect(list.sort(byRank).map((u) => u.name)).toEqual(["E", "D", "C", "A", "B"]);
    expect(rankSortKey(null)).toBe(Number.POSITIVE_INFINITY);
  });
});
