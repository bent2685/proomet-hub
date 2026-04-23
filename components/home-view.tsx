"use client";

import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { TagCloud } from "@/components/tag-cloud";
import { PromptCard } from "@/components/prompt-card";
import { EmptyState } from "@/components/empty-state";
import { Hero } from "@/components/hero";
import { PromptDetail } from "@/components/prompt-detail";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function HomeView() {
  const items = useStore((s) => s.items);
  const sources = useStore((s) => s.sources);
  const loading = useStore((s) => s.loading);
  const hydrated = useStore((s) => s.hydrated);
  const errors = useStore((s) => s.errors);
  const reload = useStore((s) => s.reloadPrompts);
  const errorEntries = Object.entries(errors);

  const router = useRouter();
  const sp = useSearchParams();
  const openId = sp.get("p");
  const urlTag = sp.get("tag");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (urlTag) setSelected(new Set([urlTag]));
  }, [urlTag]);

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) for (const t of it.tags) map.set(t, (map.get(t) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (selected.size > 0) {
        const hit = it.tags.some((t) => selected.has(t));
        if (!hit) return false;
      }
      if (q) {
        const hay = `${it.title} ${it.desc ?? ""} ${it.author ?? ""} ${it.tags.join(" ")} ${it.body.slice(0, 800)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, selected, query]);

  function toggle(tag: string) {
    setSelected((prev) => (prev.has(tag) ? new Set() : new Set([tag])));
  }

  function openDetail(id: string) {
    const params = new URLSearchParams(Array.from(sp.entries()));
    params.set("p", id);
    router.push(`/?${params.toString()}`, { scroll: false });
  }

  function closeDetail() {
    const params = new URLSearchParams(Array.from(sp.entries()));
    params.delete("p");
    router.push(`/${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  }

  const openItem = openId ? items.find((i) => i.id === openId) ?? null : null;

  return (
    <>
      <Hero count={items.length} tagCount={tagCounts.length} />

      <div className="mt-8 space-y-6">
        {hydrated && sources.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {errorEntries.length > 0 && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 flex items-start gap-3">
                <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 text-sm">
                  <div className="font-medium text-amber-600 dark:text-amber-400">
                    {errorEntries.length} 个源拉取失败
                  </div>
                  <ul className="mt-1 space-y-0.5 text-xs text-fg-muted">
                    {errorEntries.map(([sid, msg]) => {
                      const src = sources.find((s) => s.id === sid);
                      return (
                        <li key={sid} className="truncate">
                          <span className="text-fg">{src?.label ?? sid}</span> — {msg}
                        </li>
                      );
                    })}
                  </ul>
                  {errorEntries.some(([, m]) => /403|401|限流|鉴权/i.test(m)) && (
                    <p className="mt-2 text-xs text-fg-muted">
                      看起来是 GitHub 匿名调用限流。到{" "}
                      <Link href="/settings" className="underline text-fg">设置</Link>{" "}
                      填一个 GitHub PAT 就能恢复。
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索标题 / 描述 / tag / 作者 / 内容…"
                className="flex-1 h-10 px-3 rounded-md bg-bg-elevated border border-border focus:border-border-strong outline-none text-sm"
              />
              <button
                onClick={() => reload({ refresh: true })}
                disabled={loading}
                title="强制重新拉取所有源（每日 24h 自动过期，平时走本地缓存）"
                className="inline-flex items-center gap-1.5 h-10 px-3 rounded-md border border-border hover:border-border-strong bg-bg-elevated text-sm disabled:opacity-50"
              >
                <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
                强制刷新
              </button>
            </div>

            {tagCounts.length > 0 && (
              <TagCloud
                tagCounts={tagCounts}
                selected={selected}
                onToggle={toggle}
                onClear={() => setSelected(new Set())}
              />
            )}

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((it) => (
                <PromptCard key={it.id} item={it} onOpen={openDetail} />
              ))}
            </div>
            {filtered.length === 0 && items.length > 0 && (
              <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-fg-muted">
                没有匹配的 prompt
              </div>
            )}
          </>
        )}
      </div>

      <PromptDetail item={openItem} onClose={closeDetail} />
    </>
  );
}
