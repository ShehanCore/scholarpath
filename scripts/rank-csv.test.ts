import { describe, expect, it } from "vitest";
import { designUniversities } from "../src/lib/content/design-data";
import { matchRanks, nameKey, parseCsv } from "./rank-csv";

const universities = designUniversities();

describe("matchRanks", () => {
  it("matches THE names, ScholarPath names and explicit ids", () => {
    const { matches, unmatched } = matchRanks(
      [
        { rank: "=17", name: "UCL" },
        { rank: "301–350", name: "Université de Montréal" },
        { rank: "40", name: "Massachusetts Institute of Technology" },
        { rank: "9", name: "Some renamed university", universityId: "ethz-not-real" },
        { rank: "12", name: "Something else", universityId: "eth-zurich" },
        { rank: "1", name: "A university we don't list" },
      ],
      universities,
    );
    expect(Object.fromEntries(matches.map((m) => [m.universityId, m.rank]))).toEqual({
      ucl: "=17",
      "universite-de-montreal": "301–350",
      mit: "40",
      "eth-zurich": "12",
    });
    expect(unmatched).toHaveLength(universities.length - 4);
  });
  it("never guesses a malformed rank", () => {
    const { matches, badRank } = matchRanks([{ rank: "Reporter", name: "UCL" }], universities);
    expect(matches).toEqual([]);
    expect(badRank).toHaveLength(1);
  });
  it("refuses two rows for the same university", () => {
    expect(() => matchRanks([{ rank: "1", name: "UCL" }, { rank: "2", name: "ucl" }], universities)).toThrow();
  });
});

describe("helpers", () => {
  it("normalises names", () => expect(nameKey("The University of Tübingen")).toBe("university of tubingen"));
  it("parses quoted CSV", () =>
    expect(parseCsv('rank,name\r\n=17,"University of California, Berkeley"\n')).toEqual([
      ["rank", "name"],
      ["=17", "University of California, Berkeley"],
    ]));
});
