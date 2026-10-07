import type { PublicScenario } from "./types";
export const ERA_SELECTIONS = [
  {
    id: "ARGENTINA_2022",
    label: "Argentina · 2022",
    team: "Argentina",
    seasons: ["2022"],
    sources: [{ competition: 43, season: 106 }],
    sticker: "argentina2022",
  },
  {
    id: "BARCELONA_2018_19",
    label: "Barcelona · 2018/19",
    team: "Barcelona",
    seasons: ["2018/2019", "2018/19"],
    sources: [{ competition: 11, season: 4 }],
    sticker: "barcelona2019",
  },
  {
    id: "BARCELONA_2010_12",
    label: "Barcelona · 2010–12",
    team: "Barcelona",
    seasons: ["2010/2011", "2011/2012", "2010/11", "2011/12"],
    sources: [
      { competition: 11, season: 22 },
      { competition: 11, season: 23 },
    ],
    sticker: "barcelona2011",
  },
] as const;
export function matchesEra(
  s: Pick<PublicScenario, "team" | "season" | "era">,
  id: string,
): boolean {
  if (id === "ALL") return true;
  const selection = ERA_SELECTIONS.find((e) => e.id === id);
  return selection
    ? s.team === selection.team &&
        (selection.seasons as readonly string[]).includes(s.season)
    : s.era === id;
}
export function eraCoverage(scenarios: PublicScenario[]) {
  return ERA_SELECTIONS.map((era) => {
    const rows = scenarios.filter((s) => matchesEra(s, era.id));
    return {
      id: era.id,
      label: era.label,
      sticker: era.sticker,
      matches: new Set(rows.map((s) => s.matchId)).size,
      scenarios: rows.length,
    };
  });
}
