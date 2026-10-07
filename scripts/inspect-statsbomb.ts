import { readdir } from "node:fs/promises";
import { z } from "zod";
import { readJson } from "./io";
import {
  eventSchema,
  matchSchema,
  isMessi,
} from "../services/statsbomb/schema";
async function main() {
  const files = await readdir("data/raw/selected");
  for (const file of files.filter((f) => f.endsWith(".json"))) {
    const m = matchSchema.parse(await readJson(`data/raw/selected/${file}`));
    const events = z
      .array(eventSchema)
      .parse(await readJson(`data/raw/events/${m.match_id}.json`));
    const messi = events.filter((e) => isMessi(e.player));
    console.log(
      JSON.stringify({
        id: m.match_id,
        match: `${m.home_team.home_team_name} vs ${m.away_team.away_team_name}`,
        date: m.match_date,
        events: events.length,
        messiEvents: messi.length,
        types: [...new Set(messi.map((e) => e.type.name))],
      }),
    );
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
