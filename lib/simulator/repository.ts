import "server-only";
import { eraCoverage } from "../football/eras";
import { readFile } from "node:fs/promises";
import { fixtureScenarios } from "../../tests/fixtures/scenarios";
import { scenarioSchema, type Scenario } from "../football/types";
import { database } from "../supabase/server";
let cached: { until: number; scenarios: Scenario[] } | null = null;
export async function getScenarios(): Promise<Scenario[]> {
  if (cached && cached.until > Date.now()) return cached.scenarios;
  let scenarios: Scenario[] = [];
  if (database) {
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await database
        .from("scenarios")
        .select("scenario_context")
        .order("id")
        .range(offset, offset + 499);
      if (error) throw new Error("Unable to load scenarios from Supabase");
      scenarios.push(
        ...data.map((r) => scenarioSchema.parse(r.scenario_context)),
      );
      if (data.length < 500) break;
    }
  }
  if (!database && !scenarios.length) {
    try {
      scenarios = scenarioSchema
        .array()
        .parse(
          JSON.parse(await readFile("data/processed/scenarios.json", "utf8")),
        );
    } catch (error) {
      if (!(
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ))
        throw error;
    }
  }
  if (!scenarios.length) scenarios = fixtureScenarios;
  cached = { until: Date.now() + 60000, scenarios };
  return scenarios;
}
export async function coverage() {
  const all = await getScenarios();
  return {
    scenarios: all.length,
    matches: new Set(all.map((s) => s.matchId)).size,
    seasons: [...new Set(all.map((s) => s.season))],
    fixture: all.every((s) => s.source === "fixture"),
    eras: [...new Set(all.map((s) => s.era))],
    selections: eraCoverage(all),
  };
}
