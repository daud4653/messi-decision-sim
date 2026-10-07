import { it, expect, vi, afterEach } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("../lib/env", () => ({
  env: {
    GEMINI_MODEL: "test-gemini",
    GEMINI_API_KEY: "test-key",
    GROQ_MODEL: "test-groq",
    GROQ_API_KEY: "test-key",
    OLLAMA_MODEL: "test-ollama",
    OLLAMA_BASE_URL: "http://localhost:11434",
  },
}));
import {
  GeminiProvider,
  GroqProvider,
  OllamaProvider,
} from "../lib/llm/providers";
import { buildPublicScenario } from "../lib/simulator/public";
import { historicalTendencies } from "../lib/simulator/tendencies";
import { fixtureScenarios } from "./fixtures/scenarios";
const decision = {
  action: "PASS",
  targetZone: "FINAL CENTRE",
  intent: "Progress possession",
  confidence: 0.6,
  shortExplanation: "A forward pass is plausible from this position.",
};
const input = {
  scenario: buildPublicScenario(fixtureScenarios[0]),
  tendencies: historicalTendencies(fixtureScenarios[0], fixtureScenarios),
  seasonProfile: [],
};
afterEach(() => vi.unstubAllGlobals());
it.each(["gemini", "groq", "ollama"])(
  "validates %s output and sends no answer",
  async (name) => {
    const envelope =
      name === "gemini"
        ? {
            candidates: [
              { content: { parts: [{ text: JSON.stringify(decision) }] } },
            ],
          }
        : name === "groq"
          ? { choices: [{ message: { content: JSON.stringify(decision) } }] }
          : { message: { content: JSON.stringify(decision) } };
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(envelope)));
    vi.stubGlobal("fetch", fetch);
    const provider =
      name === "gemini"
        ? new GeminiProvider()
        : name === "groq"
          ? new GroqProvider()
          : new OllamaProvider();
    expect(await provider.decideScenario(input)).toEqual(decision);
    const body = String(fetch.mock.calls[0][1].body);
    for (const key of [
      "actualAction",
      "actualOutcome",
      "actualTarget",
      "eventId",
      "sourceUrl",
    ])
      expect(body).not.toContain(key);
  },
);
it("rejects malformed provider JSON instead of fabricating a decision", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ message: { content: '{"action":"MAGIC"}' } }),
        ),
      ),
  );
  await expect(new OllamaProvider().decideScenario(input)).rejects.toThrow();
});
it("rejects provider HTTP failures", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 })),
  );
  await expect(new GroqProvider().decideScenario(input)).rejects.toThrow("429");
});
