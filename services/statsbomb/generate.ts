import { createHash } from "node:crypto";
import type { Action, Scenario, Point } from "../../lib/football/types";
import {
  eraFor,
  features,
  normalize,
  scoreState,
  targetZone,
} from "../../lib/football/features";
import { isMessi, type StatsBombEvent, type StatsBombMatch } from "./schema";
export function stableId(value: string) {
  const h = createHash("sha256").update(value).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
export function mapAction(event: StatsBombEvent): Action | null {
  switch (event.type.name) {
    case "Pass":
      if (event.pass?.cross) return "CROSS";
      if (
        event.location &&
        event.pass?.end_location &&
        event.pass.end_location[0] <= event.location[0] - 5
      )
        return "RECYCLE";
      return "PASS";
    case "Carry":
      return "CARRY";
    case "Dribble":
      return "DRIBBLE";
    case "Shot":
      return "SHOT";
    default:
      return null;
  }
}
export function eventTarget(e: StatsBombEvent): Point | null {
  const p =
    e.pass?.end_location ?? e.carry?.end_location ?? e.shot?.end_location;
  return p ? normalize({ x: p[0], y: p[1] }) : null;
}
export function eventOutcome(e: StatsBombEvent): string | null {
  if (e.type.name === "Pass") return e.pass?.outcome?.name ?? "Completed pass";
  if (e.type.name === "Shot") return e.shot?.outcome?.name ?? null;
  if (e.type.name === "Dribble") return e.dribble?.outcome?.name ?? null;
  if (e.type.name === "Carry") return "Recorded carry to the shown location";
  return null;
}
export function generateScenarios(
  match: StatsBombMatch,
  input: StatsBombEvent[],
): Scenario[] {
  const events = [...input].sort((a, b) => a.index - b.index);
  let homeScore = 0,
    awayScore = 0;
  const scenarios: Scenario[] = [];
  for (let i = 0; i < events.length; i++) {
    const e = events[i],
      action = mapAction(e);
    if (isMessi(e.player) && e.location && action && e.period <= 4) {
      const ours = e.team.id === match.home_team.home_team_id;
      const location = normalize({ x: e.location[0], y: e.location[1] });
      const prior = events
        .slice(0, i)
        .filter(
          (p) =>
            p.possession === e.possession &&
            p.period === e.period &&
            p.team.id === e.team.id &&
            p.player &&
            ["Pass", "Carry", "Dribble", "Ball Receipt*", "Shot"].includes(
              p.type.name,
            ),
        );
      const target = eventTarget(e);
      const season = match.season.season_name;
      scenarios.push({
        id: stableId(`scenario:${e.id}`),
        eventId: e.id,
        matchId: stableId(`match:${match.match_id}`),
        source: "statsbomb",
        sourceUrl: `https://github.com/hudl/open-data/blob/master/data/events/${match.match_id}.json`,
        season,
        era: eraFor(e.team.name, season),
        team: e.team.name,
        opponent: ours
          ? match.away_team.away_team_name
          : match.home_team.home_team_name,
        competition: match.competition.competition_name,
        home: match.home_team.home_team_name,
        away: match.away_team.away_team_name,
        homeScore,
        awayScore,
        minute: e.minute,
        second: e.second,
        period: e.period,
        scoreState: scoreState(
          ours ? homeScore : awayScore,
          ours ? awayScore : homeScore,
        ),
        location,
        ...features(location, e.minute),
        possession: e.possession,
        possessionEventCount: prior.length,
        recentEvents: prior.slice(-5).map((p) => ({
          player: p.player!.name,
          type: p.type.name,
          minute: p.minute,
          second: p.second,
          location: p.location
            ? normalize({ x: p.location[0], y: p.location[1] })
            : null,
        })),
        difficulty:
          location.x > 95
            ? "INSTINCT"
            : prior.length < 2
              ? "FINE MARGINS"
              : "READ THE GAME",
        actualAction: action,
        actualTarget: target,
        actualTargetZone: target ? targetZone(target) : null,
        actualOutcome: eventOutcome(e),
      });
    }
    // Update score AFTER capturing the pre-action state. Shootouts do not affect match score.
    if (e.period <= 4) {
      const goal = e.type.name === "Shot" && e.shot?.outcome?.name === "Goal";
      const ownGoal = e.type.name === "Own Goal Against";
      if (goal || ownGoal) {
        const home = e.team.id === match.home_team.home_team_id;
        if (home !== ownGoal) homeScore++;
        else awayScore++;
      }
    }
  }
  return scenarios;
}
