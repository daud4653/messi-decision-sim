"use client";
import { useEffect, useRef, useState, startTransition } from "react";
import { startRound, submitDecision } from "@/app/play/actions";
import type { Action, TargetZone, Reveal } from "@/lib/football/types";
type Round = NonNullable<Awaited<ReturnType<typeof startRound>>>;
export function useSimulator() {
  const latestRequest = useRef(0);
  const [round, setRound] = useState<Round | null>(null),
    [era, setEra] = useState("ALL"),
    [seen, setSeen] = useState<string[]>([]),
    [selected, setSelected] = useState<Action | null>(null),
    [target, setTarget] = useState<TargetZone>(null),
    [reveal, setReveal] = useState<Reveal | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [complete, setComplete] = useState(false),
    [locked, setLocked] = useState(false);
  async function next(nextEra = era, previous = seen) {
    const request = ++latestRequest.current;
    setBusy(true);
    setError("");
    try {
      const r = await startRound(nextEra, previous);
      // Strict Mode can start two loads; an older response must not reset a choice.
      if (request !== latestRequest.current) return;
      setRound(r);
      setComplete(!r);
      setSelected(null);
      setTarget(null);
      setReveal(null);
      setLocked(false);
    } catch {
      if (request === latestRequest.current)
        setError("Could not load this moment. Please try again.");
    } finally {
      if (request === latestRequest.current) setBusy(false);
    }
  }
  useEffect(() => {
    startTransition(() => {
      void next("ALL", []);
    });
  }, []); // Start only once; subsequent rounds are explicit.
  async function lock() {
    if (!round || !selected || busy) return;
    setBusy(true);
    setLocked(true);
    setError("");
    try {
      const result = await submitDecision({
        roundId: round.roundId,
        action: selected,
        targetZone: target,
      });
      setReveal(result);
      setSeen([...seen, round.scenario.id]);
      try {
        const saved = JSON.parse(
          localStorage.getItem("lapulga-results") || "[]",
        ) as { roundId: string; result: Reveal }[];
        if (!saved.some((r) => r.roundId === round.roundId))
          localStorage.setItem(
            "lapulga-results",
            JSON.stringify(
              [...saved, { roundId: round.roundId, result }].slice(-500),
            ),
          );
      } catch {
        setError(
          "Result revealed. Browser storage is unavailable, so this result will not be saved.",
        );
      }
    } catch {
      setError(
        "The request could not finish. Your choice stays locked; retry to retrieve the result.",
      );
    } finally {
      setBusy(false);
    }
  }
  return {
    round,
    era,
    setEra,
    seen,
    setSeen,
    selected,
    setSelected,
    target,
    setTarget,
    reveal,
    busy,
    error,
    complete,
    locked,
    next,
    lock,
  };
}
