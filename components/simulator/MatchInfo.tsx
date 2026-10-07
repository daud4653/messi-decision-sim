import { StickerAsset } from "../stickers/StickerAsset";
import { stickerForEra } from "@/lib/stickers";
import type { PublicScenario } from "@/lib/football/types";
export function MatchInfo({ scenario: s }: { scenario: PublicScenario }) {
  return (
    <aside className="match-panel">
      <div className="match-sticker">
        <StickerAsset name={stickerForEra(s.era)} />
      </div>
      <span className="small-label">
        {s.competition} / {s.season}
      </span>
      <div className="scoreboard">
        <div>
          <span>{s.home}</span>
          <strong>{s.homeScore}</strong>
        </div>
        <div>
          <span>{s.away}</span>
          <strong>{s.awayScore}</strong>
        </div>
      </div>
      <div className="match-time">
        <strong>
          {String(s.minute).padStart(2, "0")}:
          {String(s.second).padStart(2, "0")}
        </strong>
        <span>
          {s.scoreState}
          <br />
          PERIOD {s.period}
        </span>
      </div>
      <div className="location-info">
        <span className="small-label">WHERE YOU ARE</span>
        <h2>{s.horizontalZone}</h2>
        <div>
          <strong>
            {Math.round(s.distanceToGoal)}
            <small>M</small>
          </strong>
          <span>
            FROM GOAL
            <br />
            {s.pitchZone}
          </span>
        </div>
      </div>
      <div className="possession-info">
        <span className="small-label">PREVIOUS POSSESSION</span>
        <p>
          {s.recentEvents
            .map((e) =>
              e.player.includes("Messi")
                ? "Messi"
                : e.player.split(" ").slice(-1)[0],
            )
            .join(" → ")}{" "}
          → <b>Messi</b>
        </p>
        <small>
          {s.possessionEventCount} prior events · {s.difficulty}
        </small>
      </div>
    </aside>
  );
}
