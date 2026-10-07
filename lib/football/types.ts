import { z } from "zod";
export const ACTIONS = [
  "PASS",
  "CARRY",
  "DRIBBLE",
  "SHOT",
  "CROSS",
  "RECYCLE",
] as const;
export const actionSchema = z.enum(ACTIONS);
export type Action = z.infer<typeof actionSchema>;
export const ZONES = [
  "DEFENSIVE LEFT",
  "DEFENSIVE CENTRE",
  "DEFENSIVE RIGHT",
  "MIDDLE LEFT",
  "MIDDLE CENTRE",
  "MIDDLE RIGHT",
  "FINAL LEFT",
  "FINAL CENTRE",
  "FINAL RIGHT",
] as const;
export const targetSchema = z.enum(ZONES).nullable();
export type TargetZone = z.infer<typeof targetSchema>;
export const pointSchema = z.object({
  x: z.number().min(0).max(120),
  y: z.number().min(0).max(80),
});
export type Point = z.infer<typeof pointSchema>;
export const eraSchema = z.enum([
  "EARLY_BARCELONA",
  "GUARDIOLA_BARCELONA",
  "MSN_BARCELONA",
  "LATE_BARCELONA",
  "ARGENTINA",
  "OTHER",
]);
export type Era = z.infer<typeof eraSchema>;
export const recentEventSchema = z.object({
  player: z.string(),
  type: z.string(),
  minute: z.number().nonnegative(),
  second: z.number().nonnegative(),
  location: pointSchema.nullable(),
});
export type RecentEvent = z.infer<typeof recentEventSchema>;
export const publicScenarioSchema = z.object({
  id: z.string(),
  matchId: z.string(),
  source: z.enum(["fixture", "statsbomb"]),
  season: z.string(),
  era: eraSchema,
  team: z.string(),
  opponent: z.string(),
  competition: z.string(),
  home: z.string(),
  away: z.string(),
  homeScore: z.number().int().nonnegative(),
  awayScore: z.number().int().nonnegative(),
  minute: z.number().nonnegative(),
  second: z.number().nonnegative(),
  period: z.number().int(),
  scoreState: z.enum(["WINNING", "DRAWING", "LOSING"]),
  location: pointSchema,
  pitchZone: z.string(),
  horizontalZone: z.string(),
  verticalZone: z.string(),
  distanceToGoal: z.number().nonnegative(),
  angleToGoal: z.number(),
  phase: z.string(),
  possession: z.number().int(),
  possessionEventCount: z.number().int().nonnegative(),
  recentEvents: z.array(recentEventSchema).max(5),
  difficulty: z.enum(["READ THE GAME", "FINE MARGINS", "INSTINCT"]),
});
export type PublicScenario = z.infer<typeof publicScenarioSchema>;
export const scenarioSchema = publicScenarioSchema.extend({
  eventId: z.string(),
  actualAction: actionSchema,
  actualTarget: pointSchema.nullable(),
  actualTargetZone: targetSchema,
  actualOutcome: z.string().nullable(),
  sourceUrl: z.union([z.url(), z.literal("")]),
});
export type Scenario = z.infer<typeof scenarioSchema>;
export const decisionSchema = z
  .object({
    action: actionSchema,
    targetZone: targetSchema,
    intent: z.string().min(1).max(180),
    confidence: z.number().min(0).max(1),
    shortExplanation: z.string().min(1).max(500),
  })
  .strict();
export type MessiDecision = z.infer<typeof decisionSchema>;
export type Tendencies = { count: number; frequencies: Record<Action, number> };
export type Evaluation = {
  exactMatch: boolean;
  actionSimilarity: number;
  targetSimilarity: number | null;
  eraCompatibility: number | null;
  intentCompatibility: null;
  overallSimilarity: number;
};
export type Reveal = {
  scenario: PublicScenario;
  actualAction: Action;
  actualTarget: Point | null;
  actualTargetZone: TargetZone;
  actualOutcome: string | null;
  sourceUrl: string;
  human: { action: Action; targetZone: TargetZone };
  ai: MessiDecision | null;
  aiStatus: string;
  humanScore: Evaluation;
  aiScore: Evaluation | null;
  tendencies: Tendencies;
  seasonProfile?: string[];
};
