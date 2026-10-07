import { scenarioSchema } from "../lib/football/types";
import { processedMatches } from "./processed-matches";
import { generateScenarios } from "../services/statsbomb/generate";
import { writeJson } from "./io";
async function main() {
  const scenarios: import("../lib/football/types").Scenario[] = [];
  let count = 0;
  for await (const record of processedMatches()) {
    scenarios.push(...generateScenarios(record.match, record.events));
    count++;
  }
  scenarioSchema.array().parse(scenarios);
  await writeJson("data/processed/scenarios.json", scenarios);
  console.log(
    `Generated ${scenarios.length} pre-action scenarios from ${count} matches.`,
  );
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
