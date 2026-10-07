import { it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("../lib/supabase/server", () => ({ database: null }));
vi.mock("../lib/llm/local-cache", () => ({
  readLocalDecision: async () => null,
  writeLocalDecision: async () => {},
}));
const state = vi.hoisted(() => ({ decide: vi.fn(), enabled: true }));
vi.mock("../lib/llm/providers", () => ({
  configuredProvider: () =>
    state.enabled
      ? { name: "test", model: "test-model", decideScenario: state.decide }
      : null,
}));
import { decide } from "../lib/llm/agent";
import { buildPublicScenario } from "../lib/simulator/public";
import { fixtureScenarios } from "./fixtures/scenarios";
import { historicalTendencies } from "../lib/simulator/tendencies";
const input = buildPublicScenario(fixtureScenarios[0]);
const tendencies = historicalTendencies(fixtureScenarios[0], []);
it("deduplicates concurrent decisions and reuses validated cache", async () => {
  state.decide.mockResolvedValue({
    action: "PASS",
    targetZone: null,
    intent: "Progress",
    confidence: 0.5,
    shortExplanation: "Pass forward.",
  });
  const [a, b] = await Promise.all([
    decide(input, tendencies),
    decide(input, tendencies),
  ]);
  expect(a.decision).toEqual(b.decision);
  expect(state.decide).toHaveBeenCalledTimes(1);
  await decide(input, tendencies);
  expect(state.decide).toHaveBeenCalledTimes(1);
});
it("provider failure preserves human play", async () => {
  state.decide.mockRejectedValue(new Error("Unavailable"));
  expect(
    (await decide({ ...input, id: "uncached" }, tendencies)).decision,
  ).toBeNull();
});
it("no credentials never produce a pretend AI", async () => {
  state.enabled = false;
  expect((await decide(input, tendencies)).decision).toBeNull();
});
