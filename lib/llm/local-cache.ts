import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { decisionSchema, type MessiDecision } from "../football/types";
const directory = "data/processed/agent-cache";
const filename = (key: string) =>
  `${directory}/${createHash("sha256").update(key).digest("hex")}.json`;
export async function readLocalDecision(
  key: string,
): Promise<MessiDecision | null> {
  try {
    return decisionSchema.parse(
      JSON.parse(await readFile(filename(key), "utf8")),
    );
  } catch {
    return null;
  }
}
export async function writeLocalDecision(key: string, decision: MessiDecision) {
  try {
    await mkdir(directory, { recursive: true });
    const path = filename(key),
      temp = `${path}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(decision));
    await rename(temp, path);
  } catch {
    console.warn(
      "Local AI cache unavailable; use Supabase for durable serverless caching.",
    );
  }
}
