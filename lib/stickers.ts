const messiSheet = "/stickers/Six Sticker Icons of a Football Legend.png";
const footballSheet = "/stickers/Ultimate Football Sticker Collage.png";
const messi = (label: string, viewBox: string) => ({
  src: messiSheet,
  width: 1448,
  height: 1086,
  viewBox,
  label,
});
const icon = (label: string, viewBox: string) => ({
  src: footballSheet,
  width: 1254,
  height: 1254,
  viewBox,
  label,
});
export const stickers = {
  barcelona2011: messi("Lionel Messi · Barcelona 2010–12", "530 0 416 537"),
  barcelona2019: messi("Lionel Messi · Barcelona 2018/19", "70 539 416 541"),
  argentina2022: messi("Lionel Messi · Argentina 2022", "510 541 437 539"),
  messiIdle: messi("Lionel Messi · Barcelona", "530 0 416 537"),
  messiThinking: icon("Tactical board", "178 811 308 224"),
  messiDribble: messi("Lionel Messi dribbling", "55 0 425 536"),
  messiPass: messi("Lionel Messi playing the ball", "530 0 416 537"),
  messiShoot: messi("Lionel Messi shooting", "70 539 416 541"),
  messiCelebrate: messi(
    "Lionel Messi celebrating with Argentina",
    "510 541 437 539",
  ),
  football: icon("Football", "429 398 204 204"),
} as const;
export type StickerName = keyof typeof stickers;
export function stickerForEra(era: string): StickerName {
  return era === "ARGENTINA"
    ? "argentina2022"
    : era === "LATE_BARCELONA"
      ? "barcelona2019"
      : "barcelona2011";
}
