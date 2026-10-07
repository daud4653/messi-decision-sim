import type { Action, Scenario } from "../../lib/football/types";
import { features, targetZone } from "../../lib/football/features";
// Synthetic teaching fixtures. These are NOT records of historical matches.
const seeds: {
  x: number;
  y: number;
  action: Action;
  tx: number;
  ty: number;
  minute: number;
  team: string;
  opponent: string;
  season: string;
  era: Scenario["era"];
}[] = [
  {
    x: 87,
    y: 55,
    action: "CARRY",
    tx: 101,
    ty: 44,
    minute: 67,
    team: "Barcelona",
    opponent: "Madrid XI",
    season: "2011/12",
    era: "GUARDIOLA_BARCELONA",
  },
  {
    x: 106,
    y: 35,
    action: "SHOT",
    tx: 120,
    ty: 41,
    minute: 82,
    team: "Argentina",
    opponent: "International XI",
    season: "2022",
    era: "ARGENTINA",
  },
  {
    x: 72,
    y: 42,
    action: "PASS",
    tx: 98,
    ty: 23,
    minute: 24,
    team: "Barcelona",
    opponent: "Seville XI",
    season: "2014/15",
    era: "MSN_BARCELONA",
  },
  {
    x: 94,
    y: 65,
    action: "DRIBBLE",
    tx: 99,
    ty: 54,
    minute: 54,
    team: "Barcelona",
    opponent: "Valencia XI",
    season: "2018/19",
    era: "LATE_BARCELONA",
  },
  {
    x: 102,
    y: 9,
    action: "CROSS",
    tx: 110,
    ty: 40,
    minute: 38,
    team: "Barcelona",
    opponent: "Bilbao XI",
    season: "2014/15",
    era: "MSN_BARCELONA",
  },
  {
    x: 61,
    y: 49,
    action: "RECYCLE",
    tx: 47,
    ty: 39,
    minute: 89,
    team: "Argentina",
    opponent: "International XI",
    season: "2022",
    era: "ARGENTINA",
  },
];
export const fixtureScenarios: Scenario[] = seeds.map((s, i) => ({
  id: `fixture-${i + 1}`,
  matchId: `training-${i + 1}`,
  eventId: `synthetic-${i + 1}`,
  source: "fixture",
  season: s.season,
  era: s.era,
  team: s.team,
  opponent: s.opponent,
  competition: "TRAINING RECONSTRUCTION",
  home: s.team,
  away: s.opponent,
  homeScore: 1,
  awayScore: 1,
  minute: s.minute,
  second: 21 + i * 4,
  period: s.minute > 45 ? 2 : 1,
  scoreState: "DRAWING",
  location: { x: s.x, y: s.y },
  ...features({ x: s.x, y: s.y }, s.minute),
  possession: 60 + i,
  possessionEventCount: 3,
  difficulty: i % 2 ? "FINE MARGINS" : "READ THE GAME",
  recentEvents: [
    {
      player: "Teammate",
      type: "Pass",
      minute: s.minute,
      second: 12,
      location: { x: s.x - 15, y: s.y - 8 },
    },
    {
      player: "Teammate",
      type: "Carry",
      minute: s.minute,
      second: 15,
      location: { x: s.x - 10, y: s.y - 4 },
    },
  ],
  actualAction: s.action,
  actualTarget: s.action === "DRIBBLE" ? null : { x: s.tx, y: s.ty },
  actualTargetZone:
    s.action === "DRIBBLE" ? null : targetZone({ x: s.tx, y: s.ty }),
  actualOutcome:
    "Illustrative fixture outcome — not a recorded historical event.",
  sourceUrl: "",
}));
