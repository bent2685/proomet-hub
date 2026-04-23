"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PromptCard } from "@/components/prompt-card";
import { PromptDetail } from "@/components/prompt-detail";

export default function FavoritesPage() {
  const items = useStore((s) => s.items);
  const favorites = useStore((s) => s.favorites);
  const list = useMemo(() => {
    const ids = new Set(favorites.map((f) => f.id));
    return items.filter((it) => ids.has(it.id));
  }, [items, favorites]);

  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = openId ? list.find((i) => i.id === openId) ?? null : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
      {list.length === 0 ? (
        <p className="text-sm text-fg-muted">还没有收藏。点击卡片/详情页右上角的星标收藏。</p>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((it) => (
            <PromptCard key={it.id} item={it} onOpen={setOpenId} />
          ))}
        </div>
      )}
      <PromptDetail item={openItem} onClose={() => setOpenId(null)} />
    </div>
  );
}
