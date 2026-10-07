import { ACTIONS, type Scenario, type Tendencies } from "../football/types";
import { previousActionCategory } from "../football/features";
export function historicalTendencies(
  current: Scenario,
  all: Scenario[],
): Tendencies {
  // Exclude the entire current match (including adjacent/future possession events).
  const similar = all.filter(
    (s) =>
      s.source === current.source &&
      s.matchId !== current.matchId &&
      s.era === current.era &&
      s.pitchZone === current.pitchZone &&
      s.scoreState === current.scoreState &&
      s.phase === current.phase &&
      previousActionCategory(s.recentEvents.at(-1)) ===
        previousActionCategory(current.recentEvents.at(-1)) &&
      Math.floor(s.distanceToGoal / 10) ===
        Math.floor(current.distanceToGoal / 10),
  );
  const frequencies = Object.fromEntries(
    ACTIONS.map((a) => [
      a,
      similar.length
        ? similar.filter((s) => s.actualAction === a).length / similar.length
        : 0,
    ]),
  ) as Tendencies["frequencies"];
  return { count: similar.length, frequencies };
}
