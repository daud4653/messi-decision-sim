"use server";
import { z } from "zod";
import { randomInt } from "node:crypto";
import { actionSchema, targetSchema, type Reveal } from "@/lib/football/types";
import { matchesEra } from "@/lib/football/eras";
import { getScenarios } from "@/lib/simulator/repository";
import { buildPublicScenario } from "@/lib/simulator/public";
import { historicalTendencies } from "@/lib/simulator/tendencies";
import { createRound, lockRound, saveRound } from "@/lib/simulator/rounds";
import { evaluate } from "@/lib/evaluation/score";
import { decide } from "@/lib/llm/agent";
import { getSeasonProfile } from "@/lib/enrichment/server";
export async function startRound(era = "ALL", seen: string[] = []) {
  z.string().max(40).parse(era);
  z.array(z.string().max(80)).max(50000).parse(seen);
  const all = await getScenarios();
  const pool = all.filter((s) => matchesEra(s, era));
  const available = pool.filter((s) => !seen.includes(s.id));
  const scenario = available.length
    ? available[all[0]?.source === "fixture" ? 0 : randomInt(available.length)]
    : undefined;
  if (!scenario) return null;
  return {
    roundId: await createRound(scenario.id),
    scenario: buildPublicScenario(scenario),
    total: pool.length,
  };
}
export async function submitDecision(input: unknown): Promise<Reveal> {
  const data = z
    .object({
      roundId: z.uuid(),
      action: actionSchema,
      targetZone: targetSchema,
    })
    .strict()
    .parse(input);
  const round = await lockRound(data.roundId, data.action, data.targetZone);
  if (round.result) return round.result;
  const all = await getScenarios();
  const s = all.find((s) => s.id === round.scenarioId);
  if (!s) throw new Error("Scenario unavailable");
  const human = round.choice!;
  const tendencies = historicalTendencies(s, all);
  const profile = await getSeasonProfile(s.season, s.team).catch(() => []);
  const result = await decide(buildPublicScenario(s), tendencies, profile);
  const reveal: Reveal = {
    scenario: buildPublicScenario(s),
    actualAction: s.actualAction,
    actualTarget: s.actualTarget,
    actualTargetZone: s.actualTargetZone,
    actualOutcome: s.actualOutcome,
    sourceUrl: s.sourceUrl,
    human,
    seasonProfile: profile.flatMap((p) =>
      p.metrics.map((m) => `${m.metric.replaceAll("_", " ")}: ${m.value}`),
    ),
    ai: result.decision,
    aiStatus: result.status,
    humanScore: evaluate(
      human.action,
      human.targetZone,
      s.actualAction,
      s.actualTargetZone,
      tendencies,
    ),
    aiScore: result.decision
      ? evaluate(
          result.decision.action,
          result.decision.targetZone,
          s.actualAction,
          s.actualTargetZone,
          tendencies,
        )
      : null,
    tendencies,
  };
  return saveRound(data.roundId, reveal);
}
