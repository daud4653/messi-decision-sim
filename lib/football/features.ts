import type { Era, Point, TargetZone } from "./types";
export const normalize = (
  p: Point,
  direction: "right" | "left" = "right",
): Point => {
  const x = Math.max(0, Math.min(120, p.x));
  const y = Math.max(0, Math.min(80, p.y));
  return direction === "right" ? { x, y } : { x: 120 - x, y: 80 - y };
};
// StatsBomb already expresses event coordinates in the acting team's attacking direction.
export const distanceToGoal = ({ x, y }: Point) =>
  Math.hypot(((120 - x) * 105) / 120, ((40 - y) * 68) / 80);
export const angleToGoal = ({ x, y }: Point) =>
  (Math.atan2((Math.abs(40 - y) * 68) / 80, ((120 - x) * 105) / 120) * 180) /
  Math.PI;
export const verticalZone = (p: Point) =>
  p.x < 40 ? "DEFENSIVE" : p.x < 80 ? "MIDDLE" : "FINAL";
export const horizontalZone = (p: Point) =>
  p.y < 16
    ? "LEFT WING"
    : p.y < 32
      ? "LEFT HALF-SPACE"
      : p.y < 48
        ? "CENTRE"
        : p.y < 64
          ? "RIGHT HALF-SPACE"
          : "RIGHT WING";
export const targetZone = (p: Point): TargetZone =>
  `${verticalZone(p)} ${p.y < 27 ? "LEFT" : p.y > 53 ? "RIGHT" : "CENTRE"}` as TargetZone;
export const pitchZone = (p: Point) =>
  p.x >= 102 && p.y >= 18 && p.y <= 62
    ? "PENALTY BOX"
    : `${verticalZone(p)} THIRD`;
export const phase = (minute: number) =>
  minute <= 30
    ? "0–30"
    : minute <= 60
      ? "31–60"
      : minute <= 75
        ? "61–75"
        : "76+";
export const scoreState = (ours: number, theirs: number) =>
  ours > theirs
    ? ("WINNING" as const)
    : ours < theirs
      ? ("LOSING" as const)
      : ("DRAWING" as const);
export function eraFor(team: string, season: string): Era {
  if (team === "Argentina") return "ARGENTINA";
  if (team !== "Barcelona") return "OTHER";
  const year = Number(season.slice(0, 4));
  return year < 2008
    ? "EARLY_BARCELONA"
    : year <= 2011
      ? "GUARDIOLA_BARCELONA"
      : year >= 2014 && year <= 2016
        ? "MSN_BARCELONA"
        : year >= 2017
          ? "LATE_BARCELONA"
          : "OTHER";
}
export function features(p: Point, minute: number) {
  return {
    pitchZone: pitchZone(p),
    horizontalZone: horizontalZone(p),
    verticalZone: verticalZone(p),
    distanceToGoal: distanceToGoal(p),
    angleToGoal: angleToGoal(p),
    phase: phase(minute),
  };
}
export function zoneCentre(zone: TargetZone): Point | null {
  if (!zone) return null;
  const [v, h] = zone.split(" ");
  return {
    x: v === "FINAL" ? 100 : v === "MIDDLE" ? 60 : 20,
    y: h === "LEFT" ? 13 : h === "RIGHT" ? 67 : 40,
  };
}

export function previousActionCategory(
  event: import("./types").RecentEvent | undefined,
) {
  if (!event) return "NONE";
  const categories: Record<string, string> = {
    Pass: "PASS",
    Carry: "CARRY",
    Dribble: "DRIBBLE",
    Shot: "SHOT",
    "Ball Receipt*": "RECEIVE",
  };
  return categories[event.type] ?? "OTHER";
}
