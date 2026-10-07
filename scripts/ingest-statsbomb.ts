import { readdir } from "node:fs/promises";
import { z } from "zod";
import { eventSchema, matchSchema } from "../services/statsbomb/schema";
import { readJson, writeJson } from "./io";
async function main() {
  const files = await readdir("data/raw/selected");
  const ids: number[] = [];
  for (const file of files.filter((f) => f.endsWith(".json"))) {
    const match = matchSchema.parse(
      await readJson(`data/raw/selected/${file}`),
    );
    const events = z
      .array(eventSchema)
      .parse(await readJson(`data/raw/events/${match.match_id}.json`));
    await writeJson(`data/processed/matches/${match.match_id}.json`, {
      match,
      events,
    });
    ids.push(match.match_id);
  }
  await writeJson("data/processed/matches.json", { version: 2, matches: ids });
  console.log(`Validated and ingested ${ids.length} matches locally.`);
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
