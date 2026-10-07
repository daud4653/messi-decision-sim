import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { readJson } from "./io";
import { processedMatches } from "./processed-matches";
import {
  eventSchema,
  matchSchema,
  MESSI_ID,
} from "../services/statsbomb/schema";
import {
  stableId,
  eventTarget,
  eventOutcome,
} from "../services/statsbomb/generate";
import { enrichmentSchema, metricNames } from "../lib/enrichment/schema";
import { scenarioSchema } from "../lib/football/types";
nextEnv.loadEnvConfig(process.cwd());
async function main() {
  const url = z.url().parse(process.env.NEXT_PUBLIC_SUPABASE_URL),
    key = z.string().min(1).parse(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const db = createClient(url, key, { auth: { persistSession: false } });
  async function upsert(table: string, rows: Record<string, unknown>[]) {
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await db
        .from(table)
        .upsert(rows.slice(i, i + 200), { onConflict: "id" });
      if (error) throw new Error(`${table}: ${error.message}`);
    }
  }
  let matchCount = 0;
  for await (const { match: m, events } of processedMatches()) {
    matchCount++;
    const compId = stableId(
        `competition:${m.competition.competition_id}:${m.season.season_id}`,
      ),
      matchId = stableId(`match:${m.match_id}`);
    await upsert("competitions", [
      {
        id: compId,
        source: "statsbomb",
        source_id: String(m.competition.competition_id),
        name: m.competition.competition_name,
        season_name: m.season.season_name,
        metadata: m.competition,
      },
    ]);
    await upsert("teams", [
      {
        id: stableId(`team:${m.home_team.home_team_id}`),
        source: "statsbomb",
        source_id: String(m.home_team.home_team_id),
        name: m.home_team.home_team_name,
        metadata: m.home_team,
      },
      {
        id: stableId(`team:${m.away_team.away_team_id}`),
        source: "statsbomb",
        source_id: String(m.away_team.away_team_id),
        name: m.away_team.away_team_name,
        metadata: m.away_team,
      },
    ]);
    const players = new Map(
      events.filter((e) => e.player).map((e) => [e.player!.id, e.player!]),
    );
    await upsert(
      "players",
      [...players.values()].map((p) => ({
        id: stableId(`player:${p.id}`),
        source: "statsbomb",
        source_id: String(p.id),
        name: p.name,
        nickname: p.id === MESSI_ID ? "Messi" : null,
        metadata: p,
      })),
    );
    await upsert("matches", [
      {
        id: matchId,
        source: "statsbomb",
        source_id: String(m.match_id),
        competition_id: compId,
        home_team_id: stableId(`team:${m.home_team.home_team_id}`),
        away_team_id: stableId(`team:${m.away_team.away_team_id}`),
        match_date: m.match_date,
        season: m.season.season_name,
        home_score: m.home_score,
        away_score: m.away_score,
        metadata: m,
      },
    ]);
    await upsert(
      "events",
      events.map((e) => {
        const end = eventTarget(e);
        return {
          id: stableId(`event:${e.id}`),
          source_event_id: e.id,
          match_id: matchId,
          player_id: e.player ? stableId(`player:${e.player.id}`) : null,
          team_id: stableId(`team:${e.team.id}`),
          possession: e.possession,
          minute: e.minute,
          second: e.second,
          period: e.period,
          event_type: e.type.name,
          event_subtype: null,
          location_x: e.location?.[0] ?? null,
          location_y: e.location?.[1] ?? null,
          end_location_x: end?.x ?? null,
          end_location_y: end?.y ?? null,
          outcome: eventOutcome(e),
          raw_event: e,
        };
      }),
    );
  }
  const scenarios = scenarioSchema
    .array()
    .parse(await readJson("data/processed/scenarios.json"));
  await upsert(
    "scenarios",
    scenarios.map((s) => ({
      id: s.id,
      match_id: s.matchId,
      event_id: stableId(`event:${s.eventId}`),
      player_id: stableId(`player:${MESSI_ID}`),
      season: s.season,
      era: s.era,
      minute: s.minute,
      second: s.second,
      period: s.period,
      score_state: s.scoreState,
      location_x: s.location.x,
      location_y: s.location.y,
      pitch_zone: s.pitchZone,
      horizontal_zone: s.horizontalZone,
      vertical_zone: s.verticalZone,
      distance_to_goal: s.distanceToGoal,
      angle_to_goal: s.angleToGoal,
      previous_event_type: s.recentEvents.at(-1)?.type ?? null,
      previous_player_name: s.recentEvents.at(-1)?.player ?? null,
      possession_event_count: s.possessionEventCount,
      recent_events: s.recentEvents,
      scenario_context: s,
      actual_action: s.actualAction,
      actual_target_zone: s.actualTargetZone,
      actual_target_x: s.actualTarget?.x ?? null,
      actual_target_y: s.actualTarget?.y ?? null,
      actual_outcome: s.actualOutcome,
      difficulty: s.difficulty,
    })),
  );
  let enrichment: z.infer<typeof enrichmentSchema>[] = [];
  try {
    enrichment = z
      .array(enrichmentSchema)
      .parse(await readJson("data/enrichment/profiles.json"));
  } catch (e) {
    if (!(e instanceof Error && "code" in e && e.code === "ENOENT")) throw e;
  }
  for (const entry of enrichment) {
    for (const source of new Set(entry.metrics.map((m) => m.source))) {
      const metrics = entry.metrics.filter((m) => m.source === source);
      const canonical: Record<string, number | null> = {};
      for (const metric of metricNames) {
        const values = [
          ...new Set(
            metrics.filter((m) => m.metric === metric).map((m) => m.value),
          ),
        ];
        canonical[metric] = values.length === 1 ? values[0] : null;
      }
      const common = {
        id: stableId(
          `profile:${entry.season}:${entry.team}:${entry.matchSourceId}:${source}`,
        ),
        player_id: stableId(`player:${MESSI_ID}`),
        season: entry.season,
        source,
        metadata: { ...entry, metrics },
      };
      if (entry.matchSourceId) {
        const { appearances: _appearances, ...stats } = canonical;
        await upsert("player_match_stats", [
          {
            ...common,
            ...stats,
            match_id: stableId(`match:${entry.matchSourceId}`),
            source_url: metrics[0]?.sourceUrl,
          },
        ]);
      } else {
        const {
          shots_on_target: _shots,
          rating: _rating,
          ...stats
        } = canonical;
        const { data: team, error } = await db
          .from("teams")
          .select("id")
          .eq("name", entry.team)
          .limit(1)
          .maybeSingle();
        if (error) throw new Error(error.message);
        await upsert("player_season_profiles", [
          { ...common, ...stats, team_id: team?.id ?? null },
        ]);
      }
    }
  }
  console.log(
    `Synced ${matchCount} matches, ${scenarios.length} scenarios and ${enrichment.length} enrichment records.`,
  );
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Sync failed");
  process.exitCode = 1;
});
