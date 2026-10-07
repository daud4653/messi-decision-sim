import { z } from "zod";
import { enrichmentSchema, mergeEnrichment } from "../lib/enrichment/schema";
import { readJson, writeJson, arg } from "./io";
async function main() {
  const file = arg("file", "");
  if (!file)
    throw new Error(
      "Usage: npm run enrichment:import -- --file /path/to/import.json",
    );
  const incoming = z.array(enrichmentSchema).parse(await readJson(file));
  let existing: z.infer<typeof enrichmentSchema>[] = [];
  try {
    existing = z
      .array(enrichmentSchema)
      .parse(await readJson("data/enrichment/profiles.json"));
  } catch (e) {
    if (!(e instanceof Error && "code" in e && e.code === "ENOENT")) throw e;
  }
  const result = mergeEnrichment(existing, incoming);
  await writeJson("data/enrichment/profiles.json", result);
  console.log(
    `Imported ${incoming.length} records. ${result.length} total; conflicting fields preserved.`,
  );
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
