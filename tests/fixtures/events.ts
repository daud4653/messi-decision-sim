import type {
  StatsBombEvent,
  StatsBombMatch,
} from "../../services/statsbomb/schema";
export const match: StatsBombMatch = {
  match_id: 1,
  match_date: "2022-12-18",
  home_score: 1,
  away_score: 1,
  competition: { competition_id: 43, competition_name: "World Cup" },
  season: { season_id: 106, season_name: "2022" },
  home_team: { home_team_id: 779, home_team_name: "Argentina" },
  away_team: { away_team_id: 771, away_team_name: "France" },
};
export const event = (
  overrides: Partial<StatsBombEvent> = {},
): StatsBombEvent => ({
  id: "event-1",
  index: 1,
  period: 1,
  minute: 10,
  second: 0,
  type: { id: 30, name: "Pass" },
  player: { id: 5503, name: "Lionel Andrés Messi Cuccittini" },
  team: { id: 779, name: "Argentina" },
  possession: 10,
  location: [80, 40],
  pass: { end_location: [100, 40] },
  ...overrides,
});
