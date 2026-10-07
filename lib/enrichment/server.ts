import "server-only";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { database } from "../supabase/server";
import { enrichmentSchema, seasonTendencies } from "./schema";
export async function getSeasonProfile(season: string, team: string) {
  if (database) {
    const { data, error } = await database
      .from("player_season_profiles")
      .select("metadata")
      .eq("season", season);
    if (error) throw new Error("Season profiles unavailable");
    return seasonTendencies(
      z.array(enrichmentSchema).parse(data.map((r) => r.metadata)),
      season,
      team,
    );
  }
  try {
    return seasonTendencies(
      z
        .array(enrichmentSchema)
        .parse(
          JSON.parse(await readFile("data/enrichment/profiles.json", "utf8")),
        ),
      season,
      team,
    );
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") return [];
    throw e;
  }
}
