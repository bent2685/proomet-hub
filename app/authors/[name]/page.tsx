"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PromptCard } from "@/components/prompt-card";
import { PromptDetail } from "@/components/prompt-detail";

export default function AuthorPage({ params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name);
  const items = useStore((s) => s.items);
  const list = useMemo(() => items.filter((it) => it.author === name), [items, name]);
  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = openId ? list.find((i) => i.id === openId) ?? null : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">@{name}</h1>
      <div className="text-sm text-fg-muted">{list.length} prompts</div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((it) => (
          <PromptCard key={it.id} item={it} onOpen={setOpenId} />
        ))}
      </div>
      <PromptDetail item={openItem} onClose={() => setOpenId(null)} />
    </div>
  );
}
