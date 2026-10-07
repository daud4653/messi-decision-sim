import type { PublicScenario } from "../football/types";
// Explicit allowlist: never spread an internal scenario or raw event across this boundary.
export function buildPublicScenario(s: PublicScenario): PublicScenario {
  return {
    id: s.id,
    matchId: s.matchId,
    source: s.source,
    season: s.season,
    era: s.era,
    team: s.team,
    opponent: s.opponent,
    competition: s.competition,
    home: s.home,
    away: s.away,
    homeScore: s.homeScore,
    awayScore: s.awayScore,
    minute: s.minute,
    second: s.second,
    period: s.period,
    scoreState: s.scoreState,
    location: { x: s.location.x, y: s.location.y },
    pitchZone: s.pitchZone,
    horizontalZone: s.horizontalZone,
    verticalZone: s.verticalZone,
    distanceToGoal: s.distanceToGoal,
    angleToGoal: s.angleToGoal,
    phase: s.phase,
    possession: s.possession,
    possessionEventCount: s.possessionEventCount,
    difficulty: s.difficulty,
    recentEvents: s.recentEvents.map((e) => ({
      player: e.player,
      type: e.type,
      minute: e.minute,
      second: e.second,
      location: e.location ? { x: e.location.x, y: e.location.y } : null,
    })),
  };
}
