import { z } from "zod";
const named = z.object({ id: z.number(), name: z.string() }).passthrough();
const location = z.tuple([z.number(), z.number()]);
export const eventSchema = z
  .object({
    id: z.string(),
    index: z.number().int(),
    period: z.number().int(),
    minute: z.number(),
    second: z.number(),
    timestamp: z.string().optional(),
    type: named,
    player: named.optional(),
    team: named,
    possession: z.number().int(),
    possession_team: named.optional(),
    location: location.optional(),
    pass: z
      .object({
        end_location: location.optional(),
        cross: z.boolean().optional(),
        outcome: named.optional(),
        recipient: named.optional(),
      })
      .passthrough()
      .optional(),
    carry: z.object({ end_location: location }).passthrough().optional(),
    dribble: z.object({ outcome: named.optional() }).passthrough().optional(),
    shot: z
      .object({
        end_location: z.array(z.number()).min(2).optional(),
        outcome: named.optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();
export const matchSchema = z
  .object({
    match_id: z.number(),
    match_date: z.string(),
    home_score: z.number(),
    away_score: z.number(),
    competition: z
      .object({ competition_id: z.number(), competition_name: z.string() })
      .passthrough(),
    season: z
      .object({ season_id: z.number(), season_name: z.string() })
      .passthrough(),
    home_team: z
      .object({ home_team_id: z.number(), home_team_name: z.string() })
      .passthrough(),
    away_team: z
      .object({ away_team_id: z.number(), away_team_name: z.string() })
      .passthrough(),
  })
  .passthrough();
export const lineupSchema = z.array(
  z
    .object({
      team_id: z.number(),
      team_name: z.string(),
      lineup: z.array(
        z
          .object({ player_id: z.number(), player_name: z.string() })
          .passthrough(),
      ),
    })
    .passthrough(),
);
export type StatsBombEvent = z.infer<typeof eventSchema>;
export type StatsBombMatch = z.infer<typeof matchSchema>;
export const MESSI_ID = 5503;
export function isMessi(player: { id: number; name: string } | undefined) {
  return (
    !!player &&
    (player.id === MESSI_ID || /\blionel\b.*\bmessi\b/i.test(player.name))
  );
}
