import { coverage } from "@/lib/simulator/repository";
import { ACTIONS } from "@/lib/football/types";
import { SIMILARITY } from "@/lib/evaluation/score";
export const dynamic = "force-dynamic";
export default async function Methodology() {
  const data = await coverage();
  return (
    <main className="method">
      <p className="kicker">BEHIND THE DECISION</p>
      <h1>
        AN EXPERIMENT.
        <br />
        NOT MIND READING.
      </h1>
      <section>
        <h2>One moment. Three decisions.</h2>
        <p>
          You see the situation immediately before an action. Choose an action
          and optionally a target zone, then lock your answer. An independent AI
          agent gets the same pre-action context, without your choice. Only
          after it returns (or becomes unavailable) does the server reveal the
          recorded action.
        </p>
      </section>
      <section>
        <h2>What’s actually in this dataset?</h2>
        <a href="https://github.com/hudl/open-data" className="source-logo">
          <img
            src="/attribution/statsbomb.png"
            alt="StatsBomb — event data source"
            width="180"
          />
        </a>
        <p>
          <strong>
            {data.scenarios} scenarios · {data.matches}{" "}
            {data.fixture ? "training reconstructions" : "matches"} ·{" "}
            {data.seasons.join(", ")}
          </strong>
        </p>
        <p>
          {data.fixture
            ? "This installation currently uses six synthetic fixtures to demonstrate the game. Opponents, positions, decisions, and outcomes are illustrative. They are not historical Messi records."
            : "This installation contains imported StatsBomb events from the listed seasons. Argentina 2022 covers the World Cup; Barcelona covers La Liga in 2018/19, 2010/11 and 2011/12. This is not Messi’s full career."}
        </p>
        <div className="table-wrap">
          <table className="results-table">
            <thead>
              <tr>
                <th>ERA</th>
                <th>MATCHES</th>
                <th>MOMENTS</th>
              </tr>
            </thead>
            <tbody>
              {data.selections.map((e) => (
                <tr key={e.id}>
                  <td>{e.label}</td>
                  <td>{e.matches}</td>
                  <td>{e.scenarios}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Event-level ground truth comes from{" "}
          <a href="https://github.com/hudl/open-data">
            StatsBomb Open Data, maintained by Hudl
          </a>
          . Coordinates are normalized to an attacking direction from left to
          right. Distances assume a 105 × 68 metre pitch. Known event locations
          are shown; unknown teammate and defender positions are never invented.
        </p>
      </section>
      <section>
        <h2>Context, with its source attached.</h2>
        <p>
          <a href="https://www.messivsronaldo.app/">MessiVsRonaldo.app</a>{" "}
          provides optional season or match enrichment. It does not supply the
          event-level answer. Enrichment is imported from cached JSON, with
          source URL, metric definition, and retrieval date attached to each
          field. No live scraping is required. Conflicting sources are preserved
          separately.
        </p>
        <p>
          Similar situations use era, pitch zone, score state, match phase, and
          distance bucket. The current match is excluded. Small samples are
          shown as small samples; no full-career claims are made. End-of-season
          profiles are retrospective context, not knowledge Messi necessarily
          had at the time.
        </p>
      </section>
      <section>
        <h2>What the agent can see.</h2>
        <p>
          The score before the event, time, era, competition, ball location,
          derived geometry, and up to five earlier possession events. The actual
          action, its outcome, destination, current-event qualifiers, and
          subsequent events remain on the server. Previous actions are facts;
          unseen passing lanes and player movement are not.
        </p>
        <p>
          Gemini, Groq, and local Ollama use the same grounded prompt and
          validated response schema. Provider/model/prompt combinations are
          cached. Without a working provider, the simulator remains playable as
          Human vs Messi. AI output is an explanation and final choice, not
          private chain-of-thought.
        </p>
      </section>
      <section>
        <h2>A transparent score.</h2>
        <p className="formula">
          MDSS = 50% action + 30% target + 10% era tendency + 10% intent
        </p>
        <p>
          Unavailable terms are omitted and the remaining weights are
          renormalized. V1 has no reliable intent label, so intent is always
          omitted. Target is omitted unless both choices provide a zone. Era
          compatibility requires at least five matching examples and compares
          action frequency to the most common action. Exact action match is
          reported separately.
        </p>
        <p>
          Target scoring awards 60% for matching the longitudinal third and 40%
          for matching the lateral lane. Predicted paths point to zone centres;
          they are not precise trajectories. A high score describes similarity,
          not proof that the AI thinks like Messi.
        </p>
        <div className="table-wrap">
          <table className="results-table">
            <caption>Fixed action similarity (percent)</caption>
            <thead>
              <tr>
                <th>ACTION</th>
                {ACTIONS.map((a) => (
                  <th key={a}>{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ACTIONS.map((a, i) => (
                <tr key={a}>
                  <td>{a}</td>
                  {SIMILARITY[i].map((v, j) => (
                    <td key={j}>{Math.round(v * 100)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2>How events become actions.</h2>
        <p>
          Cross-flagged passes map to CROSS. Other passes travelling at least
          five StatsBomb units backwards map to RECYCLE. Remaining passes map to
          PASS. Carry, Dribble and Shot map directly. Unsupported events and
          shootout actions are excluded. A dribble event does not provide a
          destination, so we do not manufacture one.
        </p>
        <p>
          Era labels are broad editorial groupings. Sparse event data cannot
          reconstruct body orientation, defensive pressure geometry, every
          passing option, or the full tactical situation. Historical recall by
          an LLM also cannot be ruled out. Treat this as a reproducible
          decision-similarity experiment.
        </p>
      </section>
    </main>
  );
}
