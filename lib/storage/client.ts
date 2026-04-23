"use client";

import type { Favorite, Settings, Source, StorageMode } from "@/lib/types";

const K = {
  sources: "proomet:sources",
  favorites: "proomet:favorites",
  settings: "proomet:settings",
  mode: "proomet:mode",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

let cachedMode: StorageMode | null = null;

export async function resolveMode(): Promise<StorageMode> {
  if (cachedMode) return cachedMode;
  try {
    const res = await fetch("/api/storage-mode", { cache: "no-store" });
    const json = (await res.json()) as { mode: StorageMode };
    cachedMode = json.mode;
  } catch {
    cachedMode = "client";
  }
  return cachedMode;
}

async function apiGet<T>(path: string, fallback: T): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) return fallback;
  return (await res.json()) as T;
}

async function apiPost(path: string, body: unknown): Promise<void> {
  await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export const storage = {
  async getSources(): Promise<Source[]> {
    const mode = await resolveMode();
    if (mode === "fs") return apiGet<Source[]>("/api/sources", []);
    return read<Source[]>(K.sources, []);
  },
  async setSources(sources: Source[]): Promise<void> {
    const mode = await resolveMode();
    if (mode === "fs") return apiPost("/api/sources", sources);
    write(K.sources, sources);
  },
  async getFavorites(): Promise<Favorite[]> {
    const mode = await resolveMode();
    if (mode === "fs") return apiGet<Favorite[]>("/api/favorites", []);
    return read<Favorite[]>(K.favorites, []);
  },
  async setFavorites(favorites: Favorite[]): Promise<void> {
    const mode = await resolveMode();
    if (mode === "fs") return apiPost("/api/favorites", favorites);
    write(K.favorites, favorites);
  },
  async getSettings(): Promise<Settings> {
    const mode = await resolveMode();
    if (mode === "fs") return apiGet<Settings>("/api/settings", {});
    return read<Settings>(K.settings, {});
  },
  async setSettings(settings: Settings): Promise<void> {
    const mode = await resolveMode();
    if (mode === "fs") return apiPost("/api/settings", settings);
    write(K.settings, settings);
  },
};

export { K as STORAGE_KEYS };
