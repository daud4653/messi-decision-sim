import {
  ACTIONS,
  ZONES,
  type Action,
  type TargetZone,
} from "@/lib/football/types";
import { StickerAsset } from "../stickers/StickerAsset";
import type { useSimulator } from "./useSimulator";
const descriptions: Record<Action, string> = {
  PASS: "Find a teammate",
  CARRY: "Move with the ball",
  DRIBBLE: "Take on your marker",
  SHOT: "Go for goal",
  CROSS: "Deliver from wide",
  RECYCLE: "Keep possession",
};
export function DecisionControls({
  game,
}: {
  game: ReturnType<typeof useSimulator>;
}) {
  const { selected, setSelected, target, setTarget, locked, busy, lock } = game;
  return (
    <section className="decision-panel">
      <div className="decision-heading">
        <h2>{locked ? "DECISION LOCKED." : "WHAT DO YOU DO?"}</h2>
        <span>
          {locked ? selected : "READ THE SPACE. TRUST YOUR LEFT FOOT."}
        </span>
      </div>
      <div className="action-grid">
        {ACTIONS.map((a, i) => (
          <button
            key={a}
            className={`action-button ${selected === a ? "selected" : ""}`}
            onClick={() => setSelected(a)}
            disabled={locked || busy}
            aria-pressed={selected === a}
          >
            <span className="action-index">0{i + 1}</span>
            <strong>{a === "SHOT" ? "SHOOT" : a}</strong>
            <small>{descriptions[a]}</small>
          </button>
        ))}
      </div>
      <div className="lock-row">
        <label>
          TARGET ZONE <span>(OPTIONAL)</span>
          <select
            value={target ?? ""}
            disabled={locked || busy}
            onChange={(e) => setTarget((e.target.value as TargetZone) || null)}
          >
            <option value="">ACTION ONLY</option>
            {ZONES.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
        </label>
        <p>
          No defender positions are assumed.
          <br />
          Choose only from what you know.
        </p>
        <button
          className="button primary"
          disabled={!selected || busy}
          onClick={() => void lock()}
        >
          {busy
            ? "AI MESSI IS DECIDING…"
            : locked
              ? "RETRY LOCKED DECISION"
              : "LOCK MY DECISION"}
        </button>
      </div>
      {busy && locked && (
        <div className="thinking-art">
          <StickerAsset name="messiThinking" />
        </div>
      )}
      <p className="small-note" role="status">
        {busy && locked
          ? "Your answer is locked. The AI receives the situation without your choice."
          : "AI comparison is available when a provider is configured. Otherwise, play Human vs Messi."}
      </p>
    </section>
  );
}
