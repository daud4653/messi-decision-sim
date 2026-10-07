import Link from "next/link";
import { ACTIONS, type Reveal } from "@/lib/football/types";
export function RevealPanel({
  reveal,
  busy,
  onNext,
}: {
  reveal: Reveal;
  busy: boolean;
  onNext: () => void;
}) {
  return (
    <section className="reveal-panel" aria-live="polite">
      <div className="comparison">
        <div>
          <span>YOU</span>
          <h2>{reveal.human.action}</h2>
          <strong>
            {reveal.humanScore.overallSimilarity}
            <small>/100</small>
          </strong>
          <p>
            {reveal.humanScore.exactMatch
              ? "EXACT ACTION MATCH"
              : "A DIFFERENT READ"}
          </p>
        </div>
        <div>
          <span>AI MESSI</span>
          <h2>{reveal.ai?.action ?? "OFFLINE"}</h2>
          <strong>
            {reveal.aiScore?.overallSimilarity ?? "—"}
            <small>{reveal.aiScore ? "/100" : ""}</small>
          </strong>
          <p>{reveal.aiStatus}</p>
        </div>
        <div className="real-answer">
          <span>
            {reveal.scenario.source === "fixture"
              ? "FIXTURE ANSWER"
              : "REAL MESSI"}
          </span>
          <h2>{reveal.actualAction}</h2>
          <p>{reveal.actualOutcome ?? "Outcome not recorded."}</p>
          {reveal.sourceUrl && (
            <a href={reveal.sourceUrl} target="_blank" rel="noreferrer">
              SOURCE EVENT
            </a>
          )}
        </div>
      </div>
      <div className="tendency-bars">
        {ACTIONS.map((action) => (
          <div key={action}>
            <span>{action}</span>
            <meter
              min="0"
              max="1"
              value={reveal.tendencies.frequencies[action]}
              aria-label={`${action} historical frequency`}
            />
            <strong>
              {reveal.tendencies.count
                ? `${Math.round(reveal.tendencies.frequencies[action] * 100)}%`
                : "—"}
            </strong>
          </div>
        ))}
      </div>
      <p className="small-note">
        SEASON CONTEXT ·{" "}
        {reveal.seasonProfile?.length
          ? `${reveal.scenario.season} ${reveal.scenario.team}: ${reveal.seasonProfile.join(" · ")} — MessiVsRonaldo, retrospective totals.`
          : "No imported season profile available."}
      </p>
      <div className="why-row">
        <div>
          <span className="small-label">THE READ</span>
          <p>
            {reveal.ai?.shortExplanation ??
              "Your choice is compared with the recorded action using a fixed scoring matrix. Configure an AI provider to add an independent decision."}
          </p>
          {reveal.ai && (
            <p>
              AI confidence: {Math.round(reveal.ai.confidence * 100)}% · Intent:{" "}
              {reveal.ai.intent}
            </p>
          )}
          <small>
            {reveal.tendencies.count} similar situations, excluding this match.
            Target paths show zone centres, not precise predictions.
          </small>
        </div>
        <button className="button primary" onClick={onNext} disabled={busy}>
          NEXT MOMENT
        </button>
        <Link href="/results" className="text-link">
          SESSION RESULTS
        </Link>
      </div>
      <p className="small-note">
        MDSS measures decision similarity. It does not prove that a person or
        model thinks like Messi.
      </p>
    </section>
  );
}
