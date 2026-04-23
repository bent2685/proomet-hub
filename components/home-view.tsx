"use client";

import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { TagCloud } from "@/components/tag-cloud";
import { PromptCard } from "@/components/prompt-card";
import { EmptyState } from "@/components/empty-state";
import { Hero } from "@/components/hero";
import { PromptDetail } from "@/components/prompt-detail";
import { useRouter, useSearchParams } from "next/navigation";

export function HomeView() {
  const items = useStore((s) => s.items);
  const sources = useStore((s) => s.sources);
  const loading = useStore((s) => s.loading);
  const hydrated = useStore((s) => s.hydrated);

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
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
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
            <div className="flex items-center gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索标题 / 描述 / tag / 作者 / 内容…"
                className="flex-1 h-10 px-3 rounded-md bg-bg-elevated border border-border focus:border-border-strong outline-none text-sm"
              />
              {loading && <span className="text-xs text-fg-subtle">loading…</span>}
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
