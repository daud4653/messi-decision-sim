import { describe, it, expect } from "vitest";
import { fixtureScenarios } from "./fixtures/scenarios";
import { buildPublicScenario } from "../lib/simulator/public";
import {
  distanceToGoal,
  normalize,
  targetZone,
  scoreState,
  phase,
  features,
} from "../lib/football/features";
import { evaluate, SIMILARITY } from "../lib/evaluation/score";
import { decisionSchema } from "../lib/football/types";
import { historicalTendencies } from "../lib/simulator/tendencies";
describe("pre-decision boundary", () => {
  it("excludes answers even if unknown fields are injected at nested levels", () => {
    const input = {
      ...fixtureScenarios[0],
      secret: "LEAK",
      recentEvents: [
        { ...fixtureScenarios[0].recentEvents[0], actualAction: "LEAK" },
      ],
    };
    const publicState = buildPublicScenario(input);
    expect(JSON.stringify(publicState)).not.toContain("LEAK");
    for (const key of [
      "actualAction",
      "actualTarget",
      "actualTargetZone",
      "actualOutcome",
      "eventId",
      "sourceUrl",
    ])
      expect(publicState).not.toHaveProperty(key);
  });
  it("does not share mutable location references", () => {
    const p = buildPublicScenario(fixtureScenarios[0]);
    p.location.x = 1;
    expect(fixtureScenarios[0].location.x).toBe(87);
  });
  it("excludes all events in the same match from tendencies", () => {
    const s = fixtureScenarios[0];
    expect(historicalTendencies(s, [s, { ...s, id: "other" }]).count).toBe(0);
  });
});
describe("football geometry", () => {
  it("uses metres and normalizes attack direction", () => {
    expect(distanceToGoal({ x: 0, y: 40 })).toBe(105);
    expect(normalize({ x: 20, y: 10 }, "left")).toEqual({ x: 100, y: 70 });
    expect(normalize({ x: 20, y: 10 })).toEqual({ x: 20, y: 10 });
  });
  it("classifies boundaries", () => {
    expect(targetZone({ x: 80, y: 40 })).toBe("FINAL CENTRE");
    expect(features({ x: 110, y: 40 }, 80).pitchZone).toBe("PENALTY BOX");
    expect(scoreState(1, 2)).toBe("LOSING");
    expect(phase(31)).toBe("31–60");
  });
});
describe("deterministic scoring", () => {
  it("renormalizes unavailable signals", () => {
    expect(evaluate("PASS", null, "PASS", null).overallSimilarity).toBe(100);
    expect(evaluate("SHOT", null, "RECYCLE", null).overallSimilarity).toBe(0);
  });
  it("scores target without fabricating intent", () => {
    const score = evaluate("PASS", "FINAL LEFT", "PASS", "FINAL CENTRE");
    expect(score.targetSimilarity).toBe(0.6);
    expect(score.intentCompatibility).toBeNull();
    expect(score.overallSimilarity).toBe(85);
  });
  it("has symmetric bounded matrix", () => {
    SIMILARITY.forEach((row, i) =>
      row.forEach((v, j) => {
        expect(v).toBe(SIMILARITY[j][i]);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }),
    );
  });
});
it("rejects invalid provider decisions", () => {
  expect(
    decisionSchema.safeParse({
      action: "MAGIC",
      targetZone: null,
      intent: "score",
      confidence: 2,
      shortExplanation: "x",
    }).success,
  ).toBe(false);
  expect(
    decisionSchema.safeParse({
      action: "SHOT",
      targetZone: "FINAL CENTRE",
      intent: "Score",
      confidence: 0.5,
      shortExplanation: "Near goal.",
    }).success,
  ).toBe(true);
});

it("reapplies the safe boundary even when an internal scenario reaches the prompt", async () => {
  const { buildPrompt } = await import("../lib/llm/prompt");
  const prompt = buildPrompt({
    scenario: fixtureScenarios[0],
    tendencies: historicalTendencies(fixtureScenarios[0], []),
    seasonProfile: [],
  });
  for (const key of [
    "actualAction",
    "actualTarget",
    "actualOutcome",
    "eventId",
    "matchId",
  ])
    expect(prompt).not.toContain(key);
});

it("matches prior action categories when retrieving historical tendencies", () => {
  const current = fixtureScenarios[0];
  const different = {
    ...current,
    id: "different",
    matchId: "another-match",
    recentEvents: [{ ...current.recentEvents[0], type: "Shot" }],
  };
  expect(historicalTendencies(current, [different]).count).toBe(0);
  const matching = { ...current, id: "matching", matchId: "another-match" };
  expect(historicalTendencies(current, [matching]).count).toBe(1);
});
