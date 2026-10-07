import {
  ACTIONS,
  type Action,
  type Evaluation,
  type TargetZone,
  type Tendencies,
} from "../football/types";
// Rows and columns follow ACTIONS. Symmetric, fixed and independent of the LLM.
export const SIMILARITY = [
  [1, 0.25, 0.2, 0.1, 0.65, 0.65],
  [0.25, 1, 0.8, 0.15, 0.15, 0.25],
  [0.2, 0.8, 1, 0.2, 0.15, 0.15],
  [0.1, 0.15, 0.2, 1, 0.2, 0],
  [0.65, 0.15, 0.15, 0.2, 1, 0.25],
  [0.65, 0.25, 0.15, 0, 0.25, 1],
];
export function compareTarget(
  chosen: TargetZone,
  actual: TargetZone,
): number | null {
  if (!chosen || !actual) return null;
  if (chosen === actual) return 1;
  const [cv, ch] = chosen.split(" ");
  const [av, ah] = actual.split(" ");
  return (cv === av ? 0.6 : 0) + (ch === ah ? 0.4 : 0);
}
export function evaluate(
  action: Action,
  target: TargetZone,
  actual: Action,
  actualTarget: TargetZone,
  tendencies?: Tendencies,
): Evaluation {
  const actionSimilarity =
    SIMILARITY[ACTIONS.indexOf(action)][ACTIONS.indexOf(actual)];
  const targetSimilarity = compareTarget(target, actualTarget);
  const eraCompatibility =
    tendencies && tendencies.count >= 5
      ? tendencies.frequencies[action] /
        Math.max(...Object.values(tendencies.frequencies))
      : null;
  let numerator = 0.5 * actionSimilarity,
    denominator = 0.5;
  if (targetSimilarity !== null) {
    numerator += 0.3 * targetSimilarity;
    denominator += 0.3;
  }
  if (eraCompatibility !== null) {
    numerator += 0.1 * eraCompatibility;
    denominator += 0.1;
  }
  return {
    exactMatch: action === actual,
    actionSimilarity,
    targetSimilarity,
    eraCompatibility: eraCompatibility ?? null,
    intentCompatibility: null,
    overallSimilarity: Math.round((100 * numerator) / denominator),
  };
}
