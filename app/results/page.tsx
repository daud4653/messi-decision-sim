"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Reveal } from "@/lib/football/types";
export default function Results() {
  const [results, setResults] = useState<Reveal[]>([]),
    [ready, setReady] = useState(false),
    [group, setGroup] = useState("action");
  useEffect(() => {
    try {
      const raw = JSON.parse(
        localStorage.getItem("lapulga-results") || "[]",
      ) as { result: Reveal }[];
      setResults(
        raw.map((r) => r.result).filter((r) => r?.humanScore && r?.scenario),
      );
    } catch {}
    setReady(true);
  }, []);
  const ai = results.filter((r) => r.aiScore);
  const avg = (values: number[]) =>
    values.length
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : "—";
  const groups = new Map<string, Reveal[]>();
  for (const r of results) {
    const key =
      group === "action"
        ? r.actualAction
        : group === "season"
          ? r.scenario.season
          : group === "era"
            ? r.scenario.era.replaceAll("_", " ")
            : r.scenario.pitchZone;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="kicker">THE FINAL WHISTLE</p>
          <h1>HOW WELL DID YOU READ IT?</h1>
        </div>
        <Link href="/play" className="button primary">
          BACK TO THE PITCH
        </Link>
      </div>
      {!ready ? (
        <p role="status">LOADING YOUR SESSION…</p>
      ) : !results.length ? (
        <div className="empty-state">
          <h2>NO MINUTES PLAYED. YET.</h2>
          <p>
            Every decision starts on the pitch.
            <br />
            Play a moment to see your results here.
          </p>
          <Link href="/play" className="button primary">
            START SIMULATION
          </Link>
        </div>
      ) : (
        <>
          <p className="small-note">
            Saved on this browser ·{" "}
            {results.filter((r) => r.scenario.source === "fixture").length}{" "}
            illustrative fixture rounds · AI metrics use only {ai.length}{" "}
            available AI decisions.
          </p>
          <section className="results-stats">
            {[
              ["MOMENTS PLAYED", results.length],
              [
                "YOUR EXACT MATCH",
                `${avg(results.map((r) => Number(r.humanScore.exactMatch) * 100))}%`,
              ],
              [
                "AI EXACT MATCH",
                ai.length
                  ? `${avg(ai.map((r) => Number(r.aiScore!.exactMatch) * 100))}%`
                  : "—",
              ],
              [
                "YOUR MDSS",
                avg(results.map((r) => r.humanScore.overallSimilarity)),
              ],
              ["AI MDSS", avg(ai.map((r) => r.aiScore!.overallSimilarity))],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </section>
          <div className="results-tabs" aria-label="Breakdown">
            {["action", "season", "era", "zone"].map((g) => (
              <button
                key={g}
                className={g === group ? "active" : ""}
                aria-pressed={g === group}
                onClick={() => setGroup(g)}
              >
                BY {g.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="table-wrap">
            <table className="results-table">
              <thead>
                <tr>
                  <th>{group.toUpperCase()}</th>
                  <th>PLAYED</th>
                  <th>YOUR MDSS</th>
                  <th>AI MDSS</th>
                </tr>
              </thead>
              <tbody>
                {[...groups].map(([name, rows]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{rows.length}</td>
                    <td>
                      {avg(rows.map((r) => r.humanScore.overallSimilarity))}
                    </td>
                    <td>
                      {avg(
                        rows
                          .filter((r) => r.aiScore)
                          .map((r) => r.aiScore!.overallSimilarity),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small-note">
            MDSS is a similarity score between a simulated decision and the
            recorded action. It is not a measure of football ability or thought.
          </p>
          <button
            className="clear-results"
            onClick={() => {
              if (window.confirm("Clear the results saved in this browser?")) {
                localStorage.removeItem("lapulga-results");
                setResults([]);
              }
            }}
          >
            CLEAR LOCAL SESSION RESULTS
          </button>
        </>
      )}
    </main>
  );
}
