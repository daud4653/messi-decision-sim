import "server-only";
import { randomUUID } from "node:crypto";
import { database } from "../supabase/server";
import type { Action, TargetZone, Reveal } from "../football/types";
export type Round = {
  scenarioId: string;
  expires: number;
  choice?: { action: Action; targetZone: TargetZone };
  result?: Reveal;
};
const rounds = new Map<string, Round>();
export async function createRound(scenarioId: string) {
  const id = randomUUID();
  const expires = Date.now() + 60 * 60 * 1000;
  if (database) {
    const { error } = await database.from("round_sessions").insert({
      id,
      scenario_id: scenarioId,
      expires_at: new Date(expires).toISOString(),
    });
    if (error) throw new Error("Unable to start round");
  } else {
    for (const [key, r] of rounds)
      if (r.expires < Date.now()) rounds.delete(key);
    if (rounds.size >= 5000)
      throw new Error("Local round limit reached; try again later");
    rounds.set(id, { scenarioId, expires });
  }
  return id;
}
export async function lockRound(
  id: string,
  action: Action,
  targetZone: TargetZone,
): Promise<Round> {
  if (database) {
    const { data, error } = await database.rpc("lock_round", {
      p_id: id,
      p_action: action,
      p_target: targetZone,
    });
    if (error || !data?.[0]) throw new Error("Round expired");
    const row = data[0];
    return {
      scenarioId: row.scenario_id,
      expires: new Date(row.expires_at).getTime(),
      choice: {
        action: row.selected_action,
        targetZone: row.selected_target_zone,
      },
      result: row.result ?? undefined,
    };
  }
  const round = rounds.get(id);
  if (!round || round.expires < Date.now()) throw new Error("Round expired");
  round.choice ??= { action, targetZone };
  return round;
}
export async function saveRound(id: string, result: Reveal): Promise<Reveal> {
  if (!database) {
    const round = rounds.get(id);
    if (round) {
      round.result ??= result;
      return round.result;
    }
    throw new Error("Round expired");
  }
  const { data, error } = await database
    .from("round_sessions")
    .update({ result })
    .eq("id", id)
    .is("result", null)
    .select("result");
  if (error) throw new Error("Unable to save round");
  let saved = result;
  if (!data.length) {
    const { data: existing, error: readError } = await database
      .from("round_sessions")
      .select("result")
      .eq("id", id)
      .single();
    if (readError || !existing.result)
      throw new Error("Unable to retrieve round");
    saved = existing.result as Reveal;
  }
  if (saved.scenario.source === "statsbomb") {
    const { error: attemptError } = await database.from("user_attempts").upsert(
      {
        round_id: id,
        scenario_id: saved.scenario.id,
        selected_action: saved.human.action,
        selected_target_zone: saved.human.targetZone,
        exact_match: saved.humanScore.exactMatch,
        action_similarity: saved.humanScore.actionSimilarity,
        target_similarity: saved.humanScore.targetSimilarity,
        overall_similarity: saved.humanScore.overallSimilarity,
      },
      { onConflict: "round_id", ignoreDuplicates: true },
    );
    if (attemptError) console.warn("Attempt archive write failed");
  }
  return saved;
}
