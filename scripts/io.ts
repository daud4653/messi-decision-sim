import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { dirname } from "node:path";
export async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}
export async function writeJson(path: string, data: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2) + "\n");
  await rename(tmp, path);
}
export async function cachedDownload(relative: string) {
  const path = `data/raw/${relative}`;
  try {
    return await readJson(path);
  } catch (e) {
    if (!(e instanceof Error && "code" in e && e.code === "ENOENT")) throw e;
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/hudl/open-data/master/data/${relative}`,
        { signal: AbortSignal.timeout(60000) },
      );
      if (!response.ok)
        throw new Error(`Download ${relative}: HTTP ${response.status}`);
      const data: unknown = await response.json();
      await writeJson(path, data);
      await new Promise((r) => setTimeout(r, 250));
      return data;
    } catch (error) {
      if (
        attempt === 2 ||
        (error instanceof Error && /HTTP 40[134]/.test(error.message))
      )
        throw error;
      console.warn(`Retry ${attempt + 1}/2: ${relative}`);
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error(`Unable to download ${relative}`);
}
export function arg(name: string, fallback: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}
