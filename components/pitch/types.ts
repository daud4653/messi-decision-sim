import type { Point } from "@/lib/football/types";
export type PitchScene = {
  ball: Point;
  players: {
    id: string;
    name: string;
    position: Point;
    active?: boolean;
    sprite?: string;
  }[];
  activePlayer: string;
  paths: {
    from: Point;
    to: Point;
    kind: "actual" | "ai" | "human" | "previous";
  }[];
  cameraHints: { attackDirection: "right" | "left" };
};
