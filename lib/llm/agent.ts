import "server-only";
import { createHash } from "node:crypto";
import {
  decisionSchema,
  type MessiDecision,
  type PublicScenario,
  type Tendencies,
} from "../football/types";
import { database } from "../supabase/server";
import { configuredProvider } from "./providers";
import type { getSeasonProfile } from "../enrichment/server";
import { PROMPT_VERSION, buildPrompt } from "./prompt";
import { readLocalDecision, writeLocalDecision } from "./local-cache";
const inFlight = new Map<string, Promise<MessiDecision>>();
const memory = new Map<string, MessiDecision>();
export async function decide(
  scenario: PublicScenario,
  tendencies: Tendencies,
  seasonProfile: Awaited<ReturnType<typeof getSeasonProfile>> = [],
): Promise<{ decision: MessiDecision | null; status: string }> {
  const provider = configuredProvider();
  if (!provider)
    return { decision: null, status: "Human vs Messi · AI not configured" };
  try {
    const input = { scenario, tendencies, seasonProfile };
    const hash = createHash("sha256")
      .update(buildPrompt(input))
      .digest("hex")
      .slice(0, 16);
    const version = `${PROMPT_VERSION}:${hash}`;
    const key = [scenario.id, provider.name, provider.model, version].join(":");
    const local =
      memory.get(key) ?? (!database ? await readLocalDecision(key) : null);
    if (local) return { decision: local, status: `${provider.name} · cached` };
    if (database && scenario.source === "statsbomb") {
      const { data, error } = await database
        .from("agent_runs")
        .select("raw_response")
        .eq("scenario_id", scenario.id)
        .eq("provider", provider.name)
        .eq("model", provider.model)
        .eq("prompt_version", version)
        .maybeSingle();
      if (error) throw new Error("Cache unavailable");
      if (data?.raw_response)
        return {
          decision: decisionSchema.parse(data.raw_response),
          status: `${provider.name} · cached`,
        };
    }
    let pending = inFlight.get(key);
    if (!pending) {
      pending = (async () => {
        if (database && scenario.source === "statsbomb") {
          const { data: claimed, error } = await database.rpc(
            "claim_agent_run",
            {
              p_scenario: scenario.id,
              p_provider: provider.name,
              p_model: provider.model,
              p_version: version,
            },
          );
          if (error || !claimed)
            throw new Error("Decision already being computed");
        }
        const result = await provider.decideScenario(input);
        if (database && scenario.source === "statsbomb") {
          const { error } = await database.from("agent_runs").upsert(
            {
              scenario_id: scenario.id,
              provider: provider.name,
              model: provider.model,
              prompt_version: version,
              predicted_action: result.action,
              predicted_target_zone: result.targetZone,
              predicted_intent: result.intent,
              confidence: result.confidence,
              historical_tendencies: tendencies,
              raw_response: result,
            },
            {
              onConflict: "scenario_id,provider,model,prompt_version",
              ignoreDuplicates: false,
            },
          );
          if (error) console.warn("AI decision cache write failed");
        }
        if (memory.size > 2000) memory.clear();
        memory.set(key, result);
        if (!database) await writeLocalDecision(key, result);
        return result;
      })();
      inFlight.set(key, pending);
    }
    try {
      return {
        decision: await pending,
        status: `${provider.name} / ${provider.model}`,
      };
    } finally {
      inFlight.delete(key);
    }
  } catch {
    return { decision: null, status: "AI unavailable · human round preserved" };
  }
}
