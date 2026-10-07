import { z } from "zod";
export const metricNames = [
  "appearances",
  "minutes",
  "goals",
  "assists",
  "shots",
  "shots_on_target",
  "key_passes",
  "through_balls",
  "successful_dribbles",
  "xg",
  "xa",
  "rating",
] as const;
export const metricSchema = z
  .object({
    value: z.number().nonnegative(),
    source: z.enum(["messivsronaldo", "statsbomb", "manual"]),
    sourceUrl: z.url(),
    metric: z.enum(metricNames),
    definition: z.string().min(1).max(300),
    retrievedAt: z.iso.date(),
  })
  .strict();
export const enrichmentSchema = z
  .object({
    playerSourceId: z.literal(5503),
    season: z.string().min(4).max(20),
    matchSourceId: z.number().int().positive().nullable(),
    team: z.string().min(1).max(100),
    metrics: z.array(metricSchema).max(100),
  })
  .strict();
export type Enrichment = z.infer<typeof enrichmentSchema>;
export function mergeEnrichment(
  existing: Enrichment[],
  incoming: Enrichment[],
): Enrichment[] {
  const result = structuredClone(existing);
  for (const entry of incoming) {
    const found = result.find(
      (r) =>
        r.season === entry.season &&
        r.matchSourceId === entry.matchSourceId &&
        r.team === entry.team,
    );
    if (!found) {
      result.push(structuredClone(entry));
      continue;
    }
    for (const metric of entry.metrics) {
      if (
        !found.metrics.some((m) => JSON.stringify(m) === JSON.stringify(metric))
      )
        found.metrics.push({ ...metric });
    }
  }
  return result;
}
export function seasonTendencies(
  entries: Enrichment[],
  season: string,
  team: string,
) {
  return entries
    .filter(
      (e) => e.season === season && e.team === team && e.matchSourceId === null,
    )
    .map((e) => {
      const canonical = e.metrics.filter((m) => m.source === "messivsronaldo");
      const minuteFields = canonical.filter((m) => m.metric === "minutes");
      const minutes =
        new Set(minuteFields.map((m) => m.value)).size === 1
          ? minuteFields[0]
          : undefined;
      return {
        season: e.season,
        team: e.team,
        retrospective: true,
        metrics: canonical,
        per90:
          minutes && minutes.value > 0
            ? canonical
                .filter((m) =>
                  [
                    "shots",
                    "successful_dribbles",
                    "key_passes",
                    "through_balls",
                  ].includes(m.metric),
                )
                .map((m) => ({
                  ...m,
                  value: (m.value / minutes.value) * 90,
                  definition: `Per 90 derived from ${m.definition}; minutes: ${minutes.sourceUrl}`,
                }))
            : [],
      };
    });
}
