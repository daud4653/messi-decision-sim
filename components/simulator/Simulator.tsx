"use client";
import Link from "next/link";
import type { eraCoverage } from "@/lib/football/eras";
import { zoneCentre } from "@/lib/football/features";
import { Pitch } from "../pitch/Pitch";
import type { PitchScene } from "../pitch/types";
import { StickerAsset } from "../stickers/StickerAsset";
import { MatchInfo } from "./MatchInfo";
import { RevealPanel } from "./RevealPanel";
import { useSimulator } from "./useSimulator";
import { DecisionControls } from "./DecisionControls";
export function Simulator({
  coverage,
}: {
  coverage: {
    fixture: boolean;
    scenarios: number;
    eras: string[];
    selections: ReturnType<typeof eraCoverage>;
  };
}) {
  const game = useSimulator();
  const {
    round,
    era,
    setEra,
    seen,
    setSeen,
    reveal,
    busy,
    error,
    complete,
    locked,
    next,
    lock,
  } = game;
  const s = round?.scenario;
  const paths: PitchScene["paths"] = [];
  if (s) {
    s.recentEvents.forEach((e, i) => {
      const to = s.recentEvents[i + 1]?.location ?? s.location;
      if (e.location && to)
        paths.push({ from: e.location, to, kind: "previous" });
    });
    if (reveal) {
      if (reveal.actualTarget)
        paths.push({
          from: s.location,
          to: reveal.actualTarget,
          kind: "actual",
        });
      const a = zoneCentre(reveal.ai?.targetZone ?? null),
        h = zoneCentre(reveal.human.targetZone);
      if (a) paths.push({ from: s.location, to: a, kind: "ai" });
      if (h) paths.push({ from: s.location, to: h, kind: "human" });
    }
  }
  return (
    <main className="play-page">
      <div className="page-heading">
        <div>
          <p className="kicker">THE DECISION ROOM</p>
          <h1>
            {reveal ? "THE MOMENT, REVEALED." : "YOUR GAME. HIS INSTINCT."}
          </h1>
        </div>
      </div>
      <div className="era-panels" aria-label="Choose your era">
        <button
          className={`era-panel era-all ${era === "ALL" ? "active" : ""}`}
          aria-pressed={era === "ALL"}
          disabled={busy || (locked && !reveal)}
          onClick={() => {
            setEra("ALL");
            setSeen([]);
            void next("ALL", []);
          }}
        >
          <strong>ALL ERAS</strong>
          <span>{coverage.scenarios} moments</span>
        </button>
        {coverage.selections.map((e) => (
          <button
            key={e.id}
            className={`era-panel ${era === e.id ? "active" : ""}`}
            aria-pressed={era === e.id}
            disabled={!e.scenarios || busy || (locked && !reveal)}
            onClick={() => {
              setEra(e.id);
              setSeen([]);
              void next(e.id, []);
            }}
          >
            <StickerAsset name={e.sticker} />
            <div>
              <strong>{e.label}</strong>
              <span>
                {e.matches} matches · {e.scenarios} moments
              </span>
            </div>
          </button>
        ))}
      </div>
      <div className="session-line">
        <span>
          {coverage.fixture
            ? "TRAINING FIXTURES · ILLUSTRATIVE, NOT HISTORICAL"
            : "STATSBOMB OPEN DATA · RECORDED MOMENTS"}
        </span>
        <span>
          {seen.length} COMPLETED /{" "}
          {round?.total ?? (complete ? seen.length : coverage.scenarios)}{" "}
          MOMENTS
        </span>
      </div>
      {error && (
        <div role="alert" className="error">
          {error}
          <button onClick={() => (locked ? void lock() : void next())}>
            RETRY
          </button>
          <button onClick={() => void next()}>START A NEW MOMENT</button>
        </div>
      )}
      {complete ? (
        <section className="empty-state">
          <StickerAsset name="messiCelebrate" />
          <h2>FULL TIME.</h2>
          <p>You’ve played every available moment in this selection.</p>
          <Link className="button primary" href="/results">
            SEE YOUR RESULTS
          </Link>
          <button
            className="button"
            onClick={() => {
              setSeen([]);
              void next(era, []);
            }}
          >
            PLAY AGAIN
          </button>
        </section>
      ) : !s ? (
        <div className="empty-state" role="status">
          {busy ? "BRINGING THE BALL INTO PLAY…" : "READY FOR KICK-OFF"}
          {!busy && <button onClick={() => void next()}>LOAD SCENARIO</button>}
        </div>
      ) : (
        <>
          <section className="game-grid">
            <div className="pitch-panel">
              <div className="pitch-toolbar">
                <span>
                  <b>10</b> LIONEL MESSI
                </span>
                <span>
                  {reveal
                    ? "REPLAY / THE RECORDED ACTION"
                    : "PAUSED / BEFORE THE DECISION"}
                </span>
              </div>
              <Pitch
                scene={{
                  ball: s.location,
                  players: [
                    {
                      id: "messi",
                      name: "Messi",
                      position: s.location,
                      active: true,
                    },
                  ],
                  activePlayer: "messi",
                  paths,
                  cameraHints: { attackDirection: "right" },
                }}
              />
              <div className="pitch-key">
                <span>
                  <i className="key-dot" /> MESSI / BALL
                </span>
                <span>┄ RECENT POSSESSION</span>
                {reveal && (
                  <>
                    <span className="green">━ RECORDED</span>
                    <span className="blue">┄ AI</span>
                    <span>┄ YOU</span>
                  </>
                )}
              </div>
            </div>
            <MatchInfo scenario={s} />
          </section>
          {!reveal ? (
            <DecisionControls game={game} />
          ) : (
            <RevealPanel
              reveal={reveal}
              busy={busy}
              onNext={() => void next()}
            />
          )}
        </>
      )}
    </main>
  );
}
