import { it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("../lib/supabase/server", () => ({ database: null }));
import { createRound, lockRound } from "../lib/simulator/rounds";
it("locks server-side even when a caller sends a different second choice", async () => {
  const id = await createRound("fixture-1");
  await lockRound(id, "PASS", "FINAL LEFT");
  const r = await lockRound(id, "SHOT", "FINAL CENTRE");
  expect(r.choice).toEqual({ action: "PASS", targetZone: "FINAL LEFT" });
});
it("rejects fabricated round identifiers", async () => {
  await expect(lockRound("made-up", "PASS", null)).rejects.toThrow("expired");
});
