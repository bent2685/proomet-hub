import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = process.env.DATA_DIR;
const CACHE_FILE = DATA_DIR ? path.join(DATA_DIR, "cache.json") : null;

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type Entry<T> = { at: number; data: T };

const mem = new Map<string, Entry<unknown>>();
let loaded = false;
let writing: Promise<void> | null = null;
let pendingWrite = false;

async function loadFromDisk() {
  if (loaded) return;
  loaded = true;
  if (!CACHE_FILE) return;
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    const obj = JSON.parse(raw) as Record<string, Entry<unknown>>;
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v.at === "number") mem.set(k, v);
    }
  } catch {
    /* no cache yet */
  }
}

async function flushToDisk() {
  if (!CACHE_FILE) return;
  if (writing) {
    pendingWrite = true;
    return;
  }
  writing = (async () => {
    try {
      await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
      const obj: Record<string, Entry<unknown>> = {};
      for (const [k, v] of mem.entries()) obj[k] = v;
      await fs.writeFile(CACHE_FILE, JSON.stringify(obj), "utf-8");
    } catch (e) {
      console.error("[cache] flush failed", e);
    } finally {
      writing = null;
      if (pendingWrite) {
        pendingWrite = false;
        flushToDisk();
      }
    }
  })();
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  await loadFromDisk();
  const hit = mem.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    mem.delete(key);
    flushToDisk();
    return null;
  }
  return hit.data as T;
}

export async function cacheSet<T>(key: string, data: T): Promise<void> {
  await loadFromDisk();
  mem.set(key, { at: Date.now(), data });
  flushToDisk();
}

export async function cacheInvalidate(prefix?: string): Promise<void> {
  await loadFromDisk();
  if (!prefix) mem.clear();
  else for (const k of mem.keys()) if (k.startsWith(prefix)) mem.delete(k);
  flushToDisk();
}
