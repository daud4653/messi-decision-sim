import { it, expect } from "vitest";
import { matchesEra, eraCoverage } from "../lib/football/eras";
import { fixtureScenarios } from "./fixtures/scenarios";
it("selects exact requested seasons rather than every year in a broad era", () => {
  const base = { team: "Barcelona", era: "GUARDIOLA_BARCELONA" as const };
  expect(
    matchesEra({ ...base, season: "2010/2011" }, "BARCELONA_2010_12"),
  ).toBe(true);
  expect(
    matchesEra({ ...base, season: "2011/2012" }, "BARCELONA_2010_12"),
  ).toBe(true);
  expect(
    matchesEra({ ...base, season: "2009/2010" }, "BARCELONA_2010_12"),
  ).toBe(false);
  expect(
    matchesEra({ ...base, season: "2012/2013" }, "BARCELONA_2010_12"),
  ).toBe(false);
  expect(
    matchesEra({ ...base, season: "2018/2019" }, "BARCELONA_2018_19"),
  ).toBe(true);
  expect(
    matchesEra(
      { team: "Argentina", era: "ARGENTINA", season: "2021" },
      "ARGENTINA_2022",
    ),
  ).toBe(false);
  expect(
    matchesEra(
      { team: "Argentina", era: "ARGENTINA", season: "2022" },
      "ARGENTINA_2022",
    ),
  ).toBe(true);
});
it("counts distinct matches and exposes all three selection labels", () => {
  const rows = eraCoverage([
    ...fixtureScenarios,
    { ...fixtureScenarios[0], id: "duplicate-match" },
  ]);
  expect(rows.map((r) => r.label)).toEqual([
    "Argentina · 2022",
    "Barcelona · 2018/19",
    "Barcelona · 2010–12",
  ]);
  expect(rows[2].matches).toBe(1);
  expect(rows[2].scenarios).toBe(2);
});
