import { z } from "zod";
import { eventSchema, matchSchema } from "../services/statsbomb/schema";
import { readJson } from "./io";
const recordSchema = z.object({
  match: matchSchema,
  events: z.array(eventSchema),
});
const manifestSchema = z.object({
  version: z.literal(2),
  matches: z.array(z.number().int().positive()),
});
// Read one match at a time, so multi-season imports don't require one giant JSON string.
export async function* processedMatches() {
  const index = await readJson("data/processed/matches.json");
  if (Array.isArray(index)) {
    for (const record of index) yield recordSchema.parse(record);
    return;
  }
  const manifest = manifestSchema.parse(index);
  for (const id of manifest.matches)
    yield recordSchema.parse(
      await readJson(`data/processed/matches/${id}.json`),
    );
}
