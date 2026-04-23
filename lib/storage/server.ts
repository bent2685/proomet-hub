import { promises as fs } from "node:fs";
import path from "node:path";
import type { Favorite, Settings, Source, StorageMode } from "@/lib/types";

const DATA_DIR = process.env.DATA_DIR;

export function getStorageMode(): StorageMode {
  return DATA_DIR ? "fs" : "client";
}

async function ensureDir(): Promise<string | null> {
  if (!DATA_DIR) return null;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    return DATA_DIR;
  } catch {
    return null;
  }
}

async function readJSON<T>(file: string, fallback: T): Promise<T> {
  const dir = await ensureDir();
  if (!dir) return fallback;
  const full = path.join(dir, file);
  try {
    const raw = await fs.readFile(full, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJSON(file: string, data: unknown): Promise<boolean> {
  const dir = await ensureDir();
  if (!dir) return false;
  const full = path.join(dir, file);
  await fs.writeFile(full, JSON.stringify(data, null, 2), "utf-8");
  return true;
}

export const serverStorage = {
  async getSources(): Promise<Source[]> {
    return readJSON<Source[]>("sources.json", []);
  },
  async setSources(sources: Source[]): Promise<boolean> {
    return writeJSON("sources.json", sources);
  },
  async getFavorites(): Promise<Favorite[]> {
    return readJSON<Favorite[]>("favorites.json", []);
  },
  async setFavorites(favorites: Favorite[]): Promise<boolean> {
    return writeJSON("favorites.json", favorites);
  },
  async getSettings(): Promise<Settings> {
    return readJSON<Settings>("settings.json", {});
  },
  async setSettings(settings: Settings): Promise<boolean> {
    return writeJSON("settings.json", settings);
  },
};
