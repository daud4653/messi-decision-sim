import { z } from "zod";
import { ERA_SELECTIONS } from "../lib/football/eras";
import { cachedDownload, arg, writeJson } from "./io";
import {
  matchSchema,
  lineupSchema,
  isMessi,
} from "../services/statsbomb/schema";
async function main() {
  const competitions = z
    .array(
      z
        .object({
          competition_id: z.number(),
          season_id: z.number(),
          competition_name: z.string(),
          season_name: z.string(),
        })
        .passthrough(),
    )
    .parse(await cachedDownload("competitions.json"));
  const custom =
    process.argv.includes("--competition") || process.argv.includes("--season");
  const selections = custom
    ? [
        {
          competition: Number(arg("competition", "43")),
          season: Number(arg("season", "106")),
        },
      ]
    : ERA_SELECTIONS.flatMap((e) => [...e.sources]);
  const limit = Number(arg("limit", "1000"));
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000)
    throw new Error("--limit must be 1–1000");
  for (const { competition, season } of selections) {
    if (
      !competitions.some(
        (c) => c.competition_id === competition && c.season_id === season,
      )
    )
      throw new Error(
        "Unknown competition/season. Inspect data/raw/competitions.json.",
      );
    const matches = z
      .array(matchSchema)
      .parse(await cachedDownload(`matches/${competition}/${season}.json`));
    const candidates = matches
      .filter((m) =>
        /Barcelona|Argentina|Paris Saint-Germain|Inter Miami/.test(
          `${m.home_team.home_team_name} ${m.away_team.away_team_name}`,
        ),
      )
      .sort((a, b) => b.match_date.localeCompare(a.match_date));
    let count = 0;
    for (const match of candidates) {
      const lineups = lineupSchema.parse(
        await cachedDownload(`lineups/${match.match_id}.json`),
      );
      if (
        !lineups.some((t) =>
          t.lineup.some((p) =>
            isMessi({ id: p.player_id, name: p.player_name }),
          ),
        )
      )
        continue;
      await cachedDownload(`events/${match.match_id}.json`);
      await writeJson(`data/raw/selected/${match.match_id}.json`, match);
      console.log(
        `Cached ${match.match_id}: ${match.home_team.home_team_name} vs ${match.away_team.away_team_name} (${match.match_date})`,
      );
      if (++count >= limit) break;
    }
    console.log(
      `${count} Messi matches cached. Existing files are reused; no runtime downloads.`,
    );
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Download failed");
  process.exitCode = 1;
});
