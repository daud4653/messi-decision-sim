import { describe, it, expect } from "vitest";
import { eventSchema, isMessi } from "../services/statsbomb/schema";
import { generateScenarios, mapAction } from "../services/statsbomb/generate";
import { event, match } from "./fixtures/events";
import { buildPublicScenario } from "../lib/simulator/public";
import {
  enrichmentSchema,
  mergeEnrichment,
  seasonTendencies,
  type Enrichment,
} from "../lib/enrichment/schema";
describe("StatsBomb events", () => {
  it("validates events and detects Messi conservatively", () => {
    expect(eventSchema.parse(event()).player?.id).toBe(5503);
    expect(isMessi({ id: 4, name: "Lionel Messi" })).toBe(true);
    expect(isMessi({ id: 4, name: "Another Messi" })).toBe(false);
    expect(() => eventSchema.parse({ id: "bad" })).toThrow();
  });
  it("maps cross before recycle and separates carry/dribble", () => {
    expect(
      mapAction(event({ pass: { cross: true, end_location: [60, 40] } })),
    ).toBe("CROSS");
    expect(mapAction(event({ pass: { end_location: [75, 40] } }))).toBe(
      "RECYCLE",
    );
    expect(mapAction(event({ pass: { end_location: [76, 40] } }))).toBe("PASS");
    expect(mapAction(event({ type: { id: 43, name: "Carry" } }))).toBe("CARRY");
    expect(mapAction(event({ type: { id: 14, name: "Dribble" } }))).toBe(
      "DRIBBLE",
    );
    expect(mapAction(event({ type: { id: 1, name: "Pressure" } }))).toBeNull();
  });
  it("captures pre-goal score and never includes future possession events", () => {
    const goal = event({
      id: "goal",
      index: 2,
      type: { id: 16, name: "Shot" },
      shot: { outcome: { id: 97, name: "Goal" }, end_location: [120, 40, 1] },
      pass: undefined,
    });
    const later = event({ id: "future", index: 3, minute: 11 });
    const scenarios = generateScenarios(match, [
      later,
      goal,
      event({ player: { id: 5, name: "Teammate" } }),
    ]);
    expect(scenarios[0].homeScore).toBe(0);
    expect(scenarios[1].homeScore).toBe(1);
    expect(scenarios[0].recentEvents).toHaveLength(1);
    expect(JSON.stringify(buildPublicScenario(scenarios[0]))).not.toContain(
      '"Goal"',
    );
    expect(JSON.stringify(buildPublicScenario(scenarios[0]))).not.toContain(
      "future",
    );
  });
  it("does not rotate normalized second-half coordinates or invent dribble targets", () => {
    const s = generateScenarios(match, [
      event({
        period: 2,
        type: { id: 14, name: "Dribble" },
        pass: undefined,
        dribble: { outcome: { id: 8, name: "Complete" } },
      }),
    ])[0];
    expect(s.location).toEqual({ x: 80, y: 40 });
    expect(s.actualTarget).toBeNull();
    expect(s.actualOutcome).toBe("Complete");
  });
  it("excludes shootout events and handles own goals once", () => {
    const events = [
      event({ index: 1, type: { id: 20, name: "Own Goal Against" } }),
      event({
        index: 2,
        type: { id: 25, name: "Own Goal For" },
        team: { id: 771, name: "France" },
      }),
      event({ index: 3 }),
      event({ index: 4, period: 5 }),
    ];
    const scenarios = generateScenarios(match, events);
    expect(scenarios).toHaveLength(1);
    expect(scenarios[0].awayScore).toBe(1);
  });
  it("counts prior possession only, and excludes the opposing coordinate frame", () => {
    const scenarios = generateScenarios(match, [
      event({
        index: 1,
        team: { id: 771, name: "France" },
        player: { id: 2, name: "Defender" },
      }),
      event({ index: 2, id: "ours" }),
    ]);
    expect(scenarios[0].recentEvents).toEqual([]);
  });
});
const profile: Enrichment = {
  playerSourceId: 5503,
  season: "2011/2012",
  team: "Barcelona",
  matchSourceId: null,
  metrics: [
    {
      value: 90,
      source: "messivsronaldo",
      sourceUrl: "https://www.messivsronaldo.app/season-stats/2011-2012/",
      metric: "minutes",
      definition: "Test-only number",
      retrievedAt: "2026-10-06",
    },
    {
      value: 4,
      source: "messivsronaldo",
      sourceUrl: "https://www.messivsronaldo.app/season-stats/2011-2012/",
      metric: "shots",
      definition: "Test-only number",
      retrievedAt: "2026-10-06",
    },
  ],
};
describe("enrichment", () => {
  it("preserves conflicts and provenance, idempotently", () => {
    const conflict = {
      ...profile,
      metrics: [{ ...profile.metrics[1], value: 7 }],
    };
    const merged = mergeEnrichment([profile], [conflict]);
    expect(merged[0].metrics).toHaveLength(3);
    expect(mergeEnrichment(merged, [conflict])).toEqual(merged);
    expect(merged[0].metrics[2].sourceUrl).toBe(profile.metrics[1].sourceUrl);
    expect(profile.metrics).toHaveLength(2);
  });
  it("never feeds current match stats into season tendencies", () => {
    const result = seasonTendencies(
      [profile, { ...profile, matchSourceId: 1 }],
      profile.season,
      profile.team,
    );
    expect(result).toHaveLength(1);
    expect(result[0].per90[0].value).toBe(4);
  });
  it("requires field-level provenance", () => {
    expect(
      enrichmentSchema.safeParse({
        ...profile,
        metrics: [{ value: 10, metric: "shots" }],
      }).success,
    ).toBe(false);
  });
});

it("does not silently choose a minutes value when enrichment conflicts", () => {
  const conflict = {
    ...profile,
    metrics: [...profile.metrics, { ...profile.metrics[0], value: 180 }],
  };
  expect(
    seasonTendencies([conflict], profile.season, profile.team)[0].per90,
  ).toEqual([]);
});

it("normalizes out-of-pitch previous event coordinates while preserving raw events", () => {
  const previous = event({
    index: 1,
    player: { id: 5, name: "Teammate" },
    location: [120.2, 80.1],
  });
  const s = generateScenarios(match, [
    previous,
    event({ index: 2, id: "next" }),
  ])[0];
  expect(s.recentEvents[0].location).toEqual({ x: 120, y: 80 });
  expect(previous.location).toEqual([120.2, 80.1]);
});
