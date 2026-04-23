"use client";

import { create } from "zustand";
import { storage, resolveMode } from "@/lib/storage/client";
import { DEFAULT_SOURCES } from "@/lib/defaults";
import type { Favorite, PromptItem, Settings, Source } from "@/lib/types";

const SEEDED_KEY = "proomet:seeded";

type State = {
  sources: Source[];
  favorites: Favorite[];
  settings: Settings;
  items: PromptItem[];
  readmes: Record<string, string>;
  errors: Record<string, string>;
  loading: boolean;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  reloadPrompts: (opts?: { refresh?: boolean }) => Promise<void>;

  addSource: (url: string, label?: string) => Promise<{ ok: boolean; error?: string }>;
  removeSource: (id: string) => Promise<void>;

  toggleFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;

  setSettings: (next: Settings) => Promise<void>;
};

function rid() {
  return Math.random().toString(36).slice(2, 10);
}

export const useStore = create<State>((set, get) => ({
  sources: [],
  favorites: [],
  settings: {},
  items: [],
  readmes: {},
  errors: {},
  loading: false,
  hydrated: false,

  async hydrate() {
    if (get().hydrated) return;
    const [sources, favorites, settings, mode] = await Promise.all([
      storage.getSources(),
      storage.getFavorites(),
      storage.getSettings(),
      resolveMode(),
    ]);

    let effectiveSources = sources;
    if (
      mode === "client" &&
      sources.length === 0 &&
      typeof window !== "undefined" &&
      !window.localStorage.getItem(SEEDED_KEY)
    ) {
      effectiveSources = DEFAULT_SOURCES.map((s) => ({
        ...s,
        id: Math.random().toString(36).slice(2, 10),
        addedAt: Date.now(),
      }));
      await storage.setSources(effectiveSources);
      window.localStorage.setItem(SEEDED_KEY, "1");
    }

    set({ sources: effectiveSources, favorites, settings, hydrated: true });
    await get().reloadPrompts();
  },

  async reloadPrompts(opts) {
    const { sources, settings } = get();
    if (sources.length === 0) {
      set({ items: [], readmes: {}, errors: {} });
      return;
    }
    set({ loading: true });
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sources, settings, refresh: !!opts?.refresh }),
      });
      const json = (await res.json()) as {
        items: PromptItem[];
        readmes?: Record<string, string>;
        errors?: Record<string, string>;
      };
      set({
        items: json.items ?? [],
        readmes: json.readmes ?? {},
        errors: json.errors ?? {},
      });
    } finally {
      set({ loading: false });
    }
  },

  async addSource(url, label) {
    const clean = url.trim();
    if (!clean) return { ok: false, error: "URL 不能为空" };
    if (get().sources.some((s) => s.url === clean)) return { ok: false, error: "该源已存在" };
    const u = (() => { try { return new URL(clean); } catch { return null; } })();
    if (!u) return { ok: false, error: "URL 格式不正确" };
    const parts = u.pathname.replace(/^\/+/, "").replace(/\.git$/, "").split("/");
    if (parts.length < 2) return { ok: false, error: "需要 owner/repo 形式的 URL" };
    const [owner, repo] = parts;
    const source: Source = {
      id: rid(),
      url: clean,
      owner,
      repo,
      label: label?.trim() || `${owner}/${repo}`,
      addedAt: Date.now(),
    };
    const next = [...get().sources, source];
    await storage.setSources(next);
    set({ sources: next });
    await get().reloadPrompts();
    return { ok: true };
  },

  async removeSource(id) {
    const next = get().sources.filter((s) => s.id !== id);
    await storage.setSources(next);
    set({ sources: next });
    await get().reloadPrompts();
  },

  async toggleFavorite(id) {
    const { favorites } = get();
    const has = favorites.some((f) => f.id === id);
    const next = has ? favorites.filter((f) => f.id !== id) : [...favorites, { id, addedAt: Date.now() }];
    await storage.setFavorites(next);
    set({ favorites: next });
  },
  isFavorite(id) {
    return get().favorites.some((f) => f.id === id);
  },

  async setSettings(next) {
    await storage.setSettings(next);
    set({ settings: next });
    await get().reloadPrompts();
  },
}));
